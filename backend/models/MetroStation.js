const mongoose = require('mongoose');

const metroStationSchema = new mongoose.Schema({
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
  }
}, { timestamps: true });

// Create a geospatial index for location-based queries
metroStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MetroStation', metroStationSchema); 