const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');

// Get all parking lots
exports.getAllParkingLots = async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find().sort('name');
    res.json(parkingLots);
  } catch (err) {
    console.error('Error fetching parking lots:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single parking lot by ID
exports.getParkingLotById = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    res.json(parkingLot);
  } catch (err) {
    console.error('Error fetching parking lot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get parking lots by metro station ID
exports.getParkingLotsByMetroStation = async (req, res) => {
  try {
    const { metroStationId } = req.params;
    const parkingLots = await ParkingLot.find({ metroStationId });
    res.json(parkingLots);
  } catch (err) {
    console.error('Error fetching parking lots by metro station:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all parking slots for a specific parking lot
exports.getParkingSlots = async (req, res) => {
  try {
    const { lotId } = req.params;
    
    // Check if parking lot exists
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }
    
    // Get all slots for this lot
    const slots = await ParkingSlot.find({ lotId }).sort('zone slotNumber');
    
    // Group slots by zone
    const slotsByZone = slots.reduce((acc, slot) => {
      if (!acc[slot.zone]) {
        acc[slot.zone] = [];
      }
      acc[slot.zone].push(slot);
      return acc;
    }, {});
    
    res.json({
      parkingLot,
      zones: Object.keys(slotsByZone).sort(),
      slotsByZone
    });
  } catch (err) {
    console.error('Error fetching parking slots:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get availability of parking slots for a specific time range
exports.checkAvailability = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { startTime, endTime } = req.query;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }
    
    // Find all reservations that overlap with the requested time range
    const Reservation = require('../models/Reservation');
    const overlappingReservations = await Reservation.find({
      parkingLotId: lotId,
      status: 'active',
      $or: [
        // Case 1: Reservation starts during the requested time range
        {
          startTime: { $gte: new Date(startTime), $lt: new Date(endTime) }
        },
        // Case 2: Reservation ends during the requested time range
        {
          endTime: { $gt: new Date(startTime), $lte: new Date(endTime) }
        },
        // Case 3: Reservation completely overlaps the requested time range
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(endTime) }
        }
      ]
    }).select('parkingSlotId');
    
    // Get IDs of occupied slots from reservations
    const occupiedSlotIds = overlappingReservations.map(r => r.parkingSlotId.toString());
    
    // Get all slots for this lot
    const allSlots = await ParkingSlot.find({ lotId });
    
    // Mark slots as available or occupied based on reservations and time restrictions
    const slotsWithAvailability = allSlots.map(slot => {
      // Check if slot is in maintenance status
      if (slot.status === 'maintenance') {
        return {
          ...slot.toObject(),
          isAvailable: false,
          unavailableReason: 'maintenance'
        };
      }
      
      // Check if slot is occupied by a reservation
      if (occupiedSlotIds.includes(slot._id.toString())) {
        return {
          ...slot.toObject(),
          isAvailable: false,
          unavailableReason: 'reserved'
        };
      }
      
      // Check if slot has time restrictions that overlap with the requested period
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
          return {
            ...slot.toObject(),
            isAvailable: false,
            unavailableReason: restriction.reason
          };
        }
      }
      
      // If we got here, the slot is available
      return {
        ...slot.toObject(),
        isAvailable: true
      };
    });
    
    // Calculate availability percentage
    const totalAvailableSlots = slotsWithAvailability.filter(s => s.isAvailable).length;
    const totalSlots = allSlots.length;
    const availabilityPercentage = (totalAvailableSlots / totalSlots) * 100;
    
    // Calculate price multiplier based on availability
    let priceMultiplier = 1.0; // Normal price
    if (availabilityPercentage < 10) {
      priceMultiplier = 1.25; // 25% extra
    } else if (availabilityPercentage < 40) {
      priceMultiplier = 1.15; // 15% extra
    }
    
    // Group slots by zone
    const slotsByZone = slotsWithAvailability.reduce((acc, slot) => {
      if (!acc[slot.zone]) {
        acc[slot.zone] = [];
      }
      acc[slot.zone].push(slot);
      return acc;
    }, {});
    
    res.json({
      totalSlots,
      availableSlots: totalAvailableSlots,
      availabilityPercentage,
      priceMultiplier,
      zones: Object.keys(slotsByZone).sort(),
      slotsByZone
    });
  } catch (err) {
    console.error('Error checking slot availability:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new parking lot (Admin only)
exports.createParkingLot = async (req, res) => {
  try {
    const { name, location, totalSlots, metroStationId } = req.body;
    location.coordinates[0] = location.coordinates[0] / 100000;
    location.coordinates[1] = location.coordinates[1] / 100000;
    
    if (!name || !location || !location.coordinates || !totalSlots || !metroStationId) {
      return res.status(400).json({ message: 'Name, location coordinates, total slots, and metro station ID are required' });
    }

    // Validate coordinates
    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Location coordinates must be an array [longitude, latitude]' });
    }

    // Parse coordinates as floating point numbers
    const coordinates = [
      parseFloat(location.coordinates[0]),
      parseFloat(location.coordinates[1])
    ];

    // Check if metro station exists
    const MetroStation = require('../models/MetroStation');
    const metroStation = await MetroStation.findById(metroStationId);
    if (!metroStation) {
      return res.status(404).json({ message: 'Metro station not found' });
    }

    const newParkingLot = new ParkingLot({
      name,
      location: {
        type: 'Point',
        coordinates: coordinates
      },
      totalSlots,
      occupiedSlots: 0,
      metroStationId
    });

    await newParkingLot.save();
    res.status(201).json(newParkingLot);
  } catch (err) {
    console.error('Error creating parking lot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a parking lot (Admin only)
exports.updateParkingLot = async (req, res) => {
  try {
    const { name, location, totalSlots, metroStationId } = req.body;
    location.coordinates[0] = location.coordinates[0] / 100000;
    location.coordinates[1] = location.coordinates[1] / 100000;
    const lotId = req.params.id;
    
    // Find the parking lot first
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    // Update fields if provided
    if (name) parkingLot.name = name;
    
    if (location && location.coordinates) {
      // Validate coordinates
      if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ message: 'Location coordinates must be an array [longitude, latitude]' });
      }
      
      // Parse coordinates as floating point numbers
      const coordinates = [
        parseFloat(location.coordinates[0]),
        parseFloat(location.coordinates[1])
      ];
      
      parkingLot.location = {
        type: 'Point',
        coordinates: coordinates
      };
    }

    if (totalSlots !== undefined) {
      // Check if new total is less than current occupied slots
      if (totalSlots < parkingLot.occupiedSlots) {
        return res.status(400).json({ 
          message: 'Cannot reduce total slots below current occupied slots count',
          currentOccupied: parkingLot.occupiedSlots
        });
      }
      parkingLot.totalSlots = totalSlots;
    }

    if (metroStationId) {
      // Check if metro station exists
      const MetroStation = require('../models/MetroStation');
      const metroStation = await MetroStation.findById(metroStationId);
      if (!metroStation) {
        return res.status(404).json({ message: 'Metro station not found' });
      }
      parkingLot.metroStationId = metroStationId;
    }

    await parkingLot.save();
    res.json(parkingLot);
  } catch (err) {
    console.error('Error updating parking lot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a parking lot (Admin only)
exports.deleteParkingLot = async (req, res) => {
  try {
    const lotId = req.params.id;
    
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking lot not found' });
    }

    // Check if there are active reservations for this lot
    const Reservation = require('../models/Reservation');
    const activeReservations = await Reservation.find({ 
      parkingLotId: lotId,
      status: 'active'
    });
    
    if (activeReservations.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete parking lot with active reservations',
        activeReservationsCount: activeReservations.length
      });
    }

    // Delete all parking slots associated with this lot
    await ParkingSlot.deleteMany({ lotId });

    // Delete the parking lot
    await ParkingLot.findByIdAndDelete(lotId);
    
    res.json({ 
      message: 'Parking lot and associated slots deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting parking lot:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 