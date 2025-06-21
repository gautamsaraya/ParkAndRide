const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  parkingLotId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ParkingLot', 
    required: true 
  },
  parkingSlotId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ParkingSlot', 
    required: true 
  },
  qrCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'completed'], 
    default: 'active' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['paid', 'pending', 'refunded'], 
    default: 'pending' 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  }
}, { timestamps: true });

// Create indexes for faster lookups
reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ parkingSlotId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Reservation', reservationSchema); 