const mongoose = require('mongoose');

const timeRestrictionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    enum: ['maintenance', 'reserved', 'other'],
    default: 'maintenance'
  },
  description: {
    type: String,
    default: ''
  }
}, { _id: false });

const parkingSlotSchema = new mongoose.Schema({
  lotId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ParkingLot', 
    required: true 
  },
  slotNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  zone: { 
    type: String, 
    required: true, 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance'], 
    default: 'available' 
  },
  timeRestrictions: [timeRestrictionSchema]
}, { timestamps: true });

// Create a compound index for faster lookups by lotId and slotNumber
parkingSlotSchema.index({ lotId: 1, slotNumber: 1 }, { unique: true });

// Method to check if slot is available for a specific time period
parkingSlotSchema.methods.isAvailableForPeriod = function(startTime, endTime) {
  // If slot is in maintenance status, it's not available for any time period
  if (this.status === 'maintenance') {
    return false;
  }
  
  // Check if there are any time restrictions that overlap with the requested period
  const requestStart = new Date(startTime);
  const requestEnd = new Date(endTime);
  
  for (const restriction of this.timeRestrictions) {
    const restrictionStart = new Date(restriction.startTime);
    const restrictionEnd = new Date(restriction.endTime);
    
    // Check for overlap
    if (
      (requestStart <= restrictionEnd && requestEnd >= restrictionStart) ||
      (restrictionStart <= requestEnd && restrictionEnd >= requestStart)
    ) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema); 