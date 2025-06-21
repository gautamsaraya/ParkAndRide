const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  totalSlots: { type: Number, required: true, min: 0 },
  occupiedSlots: { type: Number, default: 0, min: 0 },
  slotIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot' }],
  metroStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetroStation', required: true }
}, { timestamps: true });

// Create a geospatial index for location-based queries
parkingLotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingLot', parkingLotSchema); 