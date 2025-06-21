const Reservation = require('../models/Reservation');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const User = require('../models/User');
const crypto = require('crypto');

// Create a new reservation
exports.createReservation = async (req, res) => {
  try {
    const { parkingLotId, parkingSlotId, startTime, endTime, price } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!parkingLotId || !parkingSlotId || !startTime || !endTime || !price) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if slot exists
    const slot = await ParkingSlot.findById(parkingSlotId);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // Check if slot belongs to the specified parking lot
    if (slot.lotId.toString() !== parkingLotId) {
      return res.status(400).json({ message: 'Parking slot does not belong to the specified parking lot' });
    }

    // Check if slot is available
    if (slot.status !== 'available') {
      return res.status(400).json({ message: 'Parking slot is not available' });
    }

    // Check if there are any overlapping reservations
    const overlappingReservations = await Reservation.find({
      parkingSlotId,
      status: 'active',
      $or: [
        // Case 1: New reservation starts during an existing reservation
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gt: new Date(startTime) }
        },
        // Case 2: New reservation ends during an existing reservation
        {
          startTime: { $lt: new Date(endTime) },
          endTime: { $gte: new Date(endTime) }
        },
        // Case 3: New reservation completely contains an existing reservation
        {
          startTime: { $gte: new Date(startTime) },
          endTime: { $lte: new Date(endTime) }
        }
      ]
    });

    if (overlappingReservations.length > 0) {
      return res.status(400).json({ message: 'Parking slot is already reserved for the selected time range' });
    }

    // Generate a unique QR code
    const qrCode = crypto.randomBytes(16).toString('hex');

    // Create the reservation
    const reservation = new Reservation({
      userId,
      parkingLotId,
      parkingSlotId,
      qrCode,
      startTime,
      endTime,
      status: 'active',
      paymentStatus: 'pending',
      price
    });

    await reservation.save();

    // Update user's frequent metro stations
    const parkingLot = await ParkingLot.findById(parkingLotId);
    if (parkingLot && parkingLot.metroStationId) {
      const user = await User.findById(userId);
      
      // Find if the metro station is already in the user's frequent list
      const existingStation = user.frequentMetroStations.find(
        station => station.stationId.toString() === parkingLot.metroStationId.toString()
      );
      
      if (existingStation) {
        // Increment the visit count
        existingStation.visitCount += 1;
      } else {
        // Add the metro station to the frequent list
        user.frequentMetroStations.push({
          stationId: parkingLot.metroStationId,
          visitCount: 1
        });
      }
      
      await user.save();
    }

    res.status(201).json(reservation);
  } catch (err) {
    console.error('Error creating reservation:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reservations for the current user
exports.getUserReservations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const reservations = await Reservation.find({ userId })
      .sort('-createdAt')
      .populate('parkingLotId', 'name')
      .populate('parkingSlotId', 'slotNumber zone');
    
    res.json(reservations);
  } catch (err) {
    console.error('Error fetching user reservations:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific reservation by ID
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const reservation = await Reservation.findOne({ _id: id, userId })
      .populate('parkingLotId', 'name location')
      .populate('parkingSlotId', 'slotNumber zone');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.json(reservation);
  } catch (err) {
    console.error('Error fetching reservation:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const reservation = await Reservation.findOne({ _id: id, userId });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if reservation can be cancelled
    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Only active reservations can be cancelled' });
    }
    
    const currentTime = new Date();
    const startTime = new Date(reservation.startTime);
    const timeDifference = startTime - currentTime; // in milliseconds
    const minutesDifference = timeDifference / (1000 * 60);
    
    reservation.status = 'cancelled';
    
    // Handle refund logic based on cancellation time
    if (reservation.paymentStatus === 'paid') {
      const user = await User.findById(userId);
      let refundAmount = 0;
      let refundReason = '';
      
      if (minutesDifference >= 30) {
        // Full refund if cancelled more than 30 minutes before start time
        refundAmount = reservation.price;
        refundReason = 'Full refund - cancelled more than 30 minutes before arrival';
      } else if (minutesDifference >= 0) {
        // 50% refund if cancelled less than 30 minutes before start time
        refundAmount = Math.round(reservation.price * 0.5);
        refundReason = 'Partial refund (50%) - cancelled less than 30 minutes before arrival';
      } else {
        // No refund if cancelled after start time
        refundAmount = 0;
        refundReason = 'No refund - cancelled after arrival time';
      }
      
      if (refundAmount > 0) {
        user.walletBalance += refundAmount;
        reservation.paymentStatus = 'refunded';
        
        // Add transaction record
        user.walletTransactions.push({
          type: 'refund',
          amount: refundAmount,
          description: refundReason,
          reservationId: reservation._id
        });
        
        await user.save();
      }
    }
    
    await reservation.save();
    
    res.json({ 
      message: 'Reservation cancelled successfully', 
      reservation,
      refundAmount: reservation.paymentStatus === 'refunded' ? refundAmount : 0
    });
  } catch (err) {
    console.error('Error cancelling reservation:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete payment for a reservation
exports.completePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user._id;
    
    const reservation = await Reservation.findOne({ _id: id, userId });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    if (reservation.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment has already been completed for this reservation' });
    }
    
    // Process payment based on payment method
    const user = await User.findById(userId);
    
    if (paymentMethod === 'wallet') {
      // Check if user has enough balance
      if (user.walletBalance < reservation.price) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      
      // Deduct from wallet
      user.walletBalance -= reservation.price;
      
      // Add transaction record
      user.walletTransactions.push({
        type: 'payment',
        amount: -reservation.price,
        description: `Payment for reservation at ${reservation.parkingLotId}`,
        reservationId: reservation._id
      });
      
      await user.save();
    }
    
    // Update reservation payment status
    reservation.paymentStatus = 'paid';
    await reservation.save();
    
    // Award random loyalty points (5-15% of price)
    const minPercent = 5;
    const maxPercent = 15;
    const randomPercent = Math.floor(Math.random() * (maxPercent - minPercent + 1)) + minPercent;
    const pointsToAward = Math.round((reservation.price * randomPercent) / 100);
    
    if (pointsToAward > 0) {
      user.loyaltyPoints += pointsToAward;
      await user.save();
    }
    
    res.json({ 
      message: 'Payment completed successfully', 
      reservation,
      loyaltyPointsAwarded: pointsToAward
    });
  } catch (err) {
    console.error('Error completing payment:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update reservation time
exports.updateReservationTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStartTime, newEndTime } = req.body;
    const userId = req.user._id;
    
    // Validate inputs
    if (!newStartTime && !newEndTime) {
      return res.status(400).json({ message: 'New start time or end time is required' });
    }
    
    const reservation = await Reservation.findOne({ _id: id, userId });
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Only active reservations can be updated' });
    }
    
    if (reservation.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Only paid reservations can be updated' });
    }
    
    const originalStartTime = new Date(reservation.startTime);
    const originalEndTime = new Date(reservation.endTime);
    const originalDuration = (originalEndTime - originalStartTime) / (1000 * 60 * 60); // in hours
    
    let updatedStartTime = newStartTime ? new Date(newStartTime) : originalStartTime;
    let updatedEndTime = newEndTime ? new Date(newEndTime) : originalEndTime;
    
    // Validate that new times follow the rules
    if (updatedStartTime < originalStartTime) {
      return res.status(400).json({ message: 'New start time cannot be earlier than original start time' });
    }
    
    if (updatedEndTime > originalEndTime) {
      return res.status(400).json({ message: 'New end time cannot be later than original end time' });
    }
    
    if (updatedStartTime >= updatedEndTime) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }
    
    // Calculate new duration and potential refund
    const newDuration = (updatedEndTime - updatedStartTime) / (1000 * 60 * 60); // in hours
    const durationDifference = originalDuration - newDuration;
    
    if (durationDifference <= 0) {
      return res.status(400).json({ message: 'New duration must be shorter than original duration' });
    }
    
    // Check for overlapping reservations with the new time
    const overlappingReservations = await Reservation.find({
      parkingSlotId: reservation.parkingSlotId,
      status: 'active',
      _id: { $ne: id }, // Exclude current reservation
      $or: [
        {
          startTime: { $lte: updatedStartTime },
          endTime: { $gt: updatedStartTime }
        },
        {
          startTime: { $lt: updatedEndTime },
          endTime: { $gte: updatedEndTime }
        },
        {
          startTime: { $gte: updatedStartTime },
          endTime: { $lte: updatedEndTime }
        }
      ]
    });
    
    if (overlappingReservations.length > 0) {
      return res.status(400).json({ message: 'The new time conflicts with another reservation' });
    }
    
    // Calculate refund amount (50% of the difference)
    const pricePerHour = reservation.price / originalDuration;
    const priceDifference = pricePerHour * durationDifference;
    const refundAmount = Math.round(priceDifference * 0.5);
    
    // Update reservation times
    reservation.startTime = updatedStartTime;
    reservation.endTime = updatedEndTime;
    await reservation.save();
    
    // Process refund if applicable
    if (refundAmount > 0) {
      const user = await User.findById(userId);
      user.walletBalance += refundAmount;
      
      // Add transaction record
      user.walletTransactions.push({
        type: 'refund',
        amount: refundAmount,
        description: 'Partial refund for reservation time update',
        reservationId: reservation._id
      });
      
      await user.save();
    }
    
    res.json({
      message: 'Reservation time updated successfully',
      reservation,
      refundAmount
    });
  } catch (err) {
    console.error('Error updating reservation time:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 