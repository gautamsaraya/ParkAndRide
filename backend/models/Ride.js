const mongoose = require("mongoose");
const crypto = require("crypto");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,
    rideType: {
      type: String,
      enum: ["on-demand", "scheduled"],
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: function () {
        return this.rideType === "scheduled";
      },
    },
    startTime: {
      type: Date,
      default: function () {
        return this.rideType === "on-demand" ? Date.now() : null;
      },
    },
    endTime: {
      type: Date,
      default: null,
    },
    distance: {
      type: Number, // in kilometers
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    qrCode: {
      type: String,
      unique: true,
    },
    parentRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
  },
  { timestamps: true }
);

// Create a geospatial index for location-based queries
rideSchema.index({ "pickupLocation.coordinates": "2dsphere" });
rideSchema.index({ "dropoffLocation.coordinates": "2dsphere" });

// Generate QR code before saving
rideSchema.pre("save", function (next) {
  if (!this.qrCode) {
    this.qrCode = crypto.randomBytes(16).toString("hex");
  }
  next();
});

module.exports = mongoose.model("Ride", rideSchema);
