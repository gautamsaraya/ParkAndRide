const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["e-rickshaw", "cab", "shuttle"],
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active",
    },
    baseStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MetroStation",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
  },
  { timestamps: true }
);

// Define a pre-save hook to set capacity based on vehicle type if not explicitly provided
vehicleSchema.pre("save", function (next) {
  if (!this.isModified("type") && this.capacity) {
    return next();
  }

  switch (this.type) {
    case "e-rickshaw":
      this.capacity = 3;
      break;
    case "cab":
      this.capacity = 4;
      break;
    case "shuttle":
      this.capacity = 8;
      break;
    default:
      // Keep the existing capacity if type is not recognized
      break;
  }
  next();
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
