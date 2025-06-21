const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Reservation = require('../models/Reservation');

// Get all parking slots
exports.getAllSlots = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort('lotId zone slotNumber');
    res.json(slots);
  } catch (err) {
    console.error('Error fetching parking slots:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single parking slot by ID
exports.getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    res.json(slot);
  } catch (err) {
    console.error('Error fetching parking slot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if a parking slot is available for a specific time period
exports.checkSlotAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.query;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }
    
    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    // Check if slot is in maintenance
    if (slot.status === 'maintenance') {
      return res.json({ isAvailable: false, reason: 'maintenance' });
    }
    
    // Check for time restrictions
    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);
    
    for (const restriction of slot.timeRestrictions || []) {
      const restrictionStart = new Date(restriction.startTime);
      const restrictionEnd = new Date(restriction.endTime);
      
      // Check for overlap
      if (
        (requestStart <= restrictionEnd && requestEnd >= restrictionStart) ||
        (restrictionStart <= requestEnd && restrictionEnd >= requestStart)
      ) {
        return res.json({ 
          isAvailable: false, 
          reason: restriction.reason,
          description: restriction.description
        });
      }
    }
    
    // Check for reservations
    const overlappingReservations = await Reservation.find({
      parkingSlotId: id,
      status: 'active',
      $or: [
        { startTime: { $gte: requestStart, $lt: requestEnd } },
        { endTime: { $gt: requestStart, $lte: requestEnd } },
        { startTime: { $lte: requestStart }, endTime: { $gte: requestEnd } }
      ]
    });
    
    if (overlappingReservations.length > 0) {
      return res.json({ isAvailable: false, reason: 'reserved' });
    }
    
    res.json({ isAvailable: true });
  } catch (err) {
    console.error('Error checking slot availability:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a time restriction to a parking slot (Admin only)
exports.addTimeRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, reason = 'maintenance', description = '' } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }
    
    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    // Check if there are active reservations that overlap with this time restriction
    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);
    
    const overlappingReservations = await Reservation.find({
      parkingSlotId: id,
      status: 'active',
      $or: [
        { startTime: { $gte: requestStart, $lt: requestEnd } },
        { endTime: { $gt: requestStart, $lte: requestEnd } },
        { startTime: { $lte: requestStart }, endTime: { $gte: requestEnd } }
      ]
    });
    
    if (overlappingReservations.length > 0) {
      return res.status(400).json({
        message: 'Cannot add time restriction - there are active reservations during this period',
        activeReservationsCount: overlappingReservations.length
      });
    }
    
    // Add the time restriction
    slot.timeRestrictions.push({
      startTime: requestStart,
      endTime: requestEnd,
      reason,
      description
    });
    
    await slot.save();
    res.json(slot);
  } catch (err) {
    console.error('Error adding time restriction:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a time restriction from a parking slot (Admin only)
exports.removeTimeRestriction = async (req, res) => {
  try {
    const { id, restrictionIndex } = req.params;
    
    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }
    
    const index = parseInt(restrictionIndex);
    if (isNaN(index) || index < 0 || index >= slot.timeRestrictions.length) {
      return res.status(400).json({ message: 'Invalid restriction index' });
    }
    
    // Remove the time restriction
    slot.timeRestrictions.splice(index, 1);
    
    await slot.save();
    res.json(slot);
  } catch (err) {
    console.error('Error removing time restriction:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new parking slot (Admin only)
exports.createSlot = async (req, res) => {
  try {
    const { lotId, slotNumber, zone, status = 'available', timeRestrictions = [] } = req.body;
    
    if (!lotId || !slotNumber || !zone) {
      return res.status(400).json({ message: 'Lot ID, slot number, and zone are required' });
    }

    // Check if parking lot exists
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    // Check if slot already exists in this lot with the same number
    const existingSlot = await ParkingSlot.findOne({ lotId, slotNumber });
    if (existingSlot) {
      return res.status(400).json({ 
        message: 'A slot with this number already exists in this parking lot' 
      });
    }

    const newSlot = new ParkingSlot({
      lotId,
      slotNumber,
      zone,
      status,
      timeRestrictions
    });

    await newSlot.save();

    // Update the parking lot's slotIds array
    parkingLot.slotIds.push(newSlot._id);
    await parkingLot.save();

    res.status(201).json(newSlot);
  } catch (err) {
    console.error('Error creating parking slot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create multiple parking slots at once (Admin only)
exports.createMultipleSlots = async (req, res) => {
  try {
    const { lotId, zone, startNumber, count, status = 'available' } = req.body;
    
    if (!lotId || !zone || !startNumber || !count) {
      return res.status(400).json({ 
        message: 'Lot ID, zone, start number, and count are required' 
      });
    }

    // Check if parking lot exists
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    const createdSlots = [];
    const slotNumbers = [];

    // Generate slot numbers based on the format (e.g., A1, A2, etc.)
    for (let i = 0; i < count; i++) {
      const slotNumber = `${zone}${startNumber + i}`;
      slotNumbers.push(slotNumber);
    }

    // Check for existing slots with these numbers
    const existingSlots = await ParkingSlot.find({
      lotId,
      slotNumber: { $in: slotNumbers }
    });

    if (existingSlots.length > 0) {
      return res.status(400).json({
        message: 'Some slot numbers already exist in this parking lot',
        existingSlots: existingSlots.map(slot => slot.slotNumber)
      });
    }

    // Create all slots
    for (let i = 0; i < count; i++) {
      const slotNumber = slotNumbers[i];
      
      const newSlot = new ParkingSlot({
        lotId,
        slotNumber,
        zone,
        status
      });

      await newSlot.save();
      createdSlots.push(newSlot);
      
      // Update the parking lot's slotIds array
      parkingLot.slotIds.push(newSlot._id);
    }

    await parkingLot.save();

    res.status(201).json({
      message: `${count} parking slots created successfully`,
      slots: createdSlots
    });
  } catch (err) {
    console.error('Error creating multiple parking slots:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a parking slot (Admin only)
exports.updateSlot = async (req, res) => {
  try {
    const { slotNumber, zone, status } = req.body;
    const slotId = req.params.id;
    
    // Find the slot first
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // Update fields if provided
    if (slotNumber) {
      // Check if another slot with this number exists in the same lot
      const existingSlot = await ParkingSlot.findOne({ 
        lotId: slot.lotId, 
        slotNumber, 
        _id: { $ne: slotId } 
      });
      
      if (existingSlot) {
        return res.status(400).json({ 
          message: 'A slot with this number already exists in this parking lot' 
        });
      }
      
      slot.slotNumber = slotNumber;
    }
    
    if (zone) slot.zone = zone;
    
    if (status) {
      // Check if there are active reservations for this slot
      if (status === 'maintenance' || status === 'occupied') {
        const activeReservations = await Reservation.find({
          parkingSlotId: slotId,
          status: 'active'
        });
        
        if (activeReservations.length > 0) {
          return res.status(400).json({
            message: 'Cannot change slot status - there are active reservations for this slot',
            activeReservationsCount: activeReservations.length
          });
        }
      }
      
      slot.status = status;
    }

    await slot.save();
    res.json(slot);
  } catch (err) {
    console.error('Error updating parking slot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a parking slot (Admin only)
exports.deleteSlot = async (req, res) => {
  try {
    const slotId = req.params.id;
    
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    // Check if there are active reservations for this slot
    const activeReservations = await Reservation.find({
      parkingSlotId: slotId,
      status: 'active'
    });
    
    if (activeReservations.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete slot - there are active reservations for this slot',
        activeReservationsCount: activeReservations.length
      });
    }

    // Remove the slot ID from the parking lot's slotIds array
    await ParkingLot.findByIdAndUpdate(
      slot.lotId,
      { $pull: { slotIds: slotId } }
    );

    // Delete the slot
    await ParkingSlot.findByIdAndDelete(slotId);
    
    res.json({ message: 'Parking slot deleted successfully' });
  } catch (err) {
    console.error('Error deleting parking slot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 