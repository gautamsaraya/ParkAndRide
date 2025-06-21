const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['deposit', 'payment', 'refund', 'loyalty_redemption'],
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  reservationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reservation',
    default: null
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores']
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phoneNumber: { 
    type: String,
    trim: true
  },
  password: { type: String, required: true },
  vehicleNumber: { type: String, trim: true },
  walletBalance: { type: Number, default: 0 },
  walletTransactions: [transactionSchema],
  loyaltyPoints: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  preferences: {
    defaultMetroStation: { type: mongoose.Schema.Types.ObjectId, ref: 'MetroStation', default: null },
    lastMileMode: { type: String, enum: ['cab', 'shuttle', 'e-rickshaw', null], default: null },
  },
  frequentMetroStations: [{ 
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetroStation' },
    visitCount: { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
