const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const crypto = require("crypto");

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (coord1, coord2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1[1])) *
      Math.cos(toRad(coord2[1])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // in kilometers
};

// Calculate fare based on distance, vehicle type, and sharing preference
const calculateFare = (
  distance,
  vehicleType,
  seatsBooked,
  totalCapacity,
  isShared
) => {
  // Base fare calculation: distance (in km) * 2, rounded up, then * 10
  const baseFare = Math.ceil(distance) * 2 * 10 * totalCapacity;

  if (isShared) {
    // If shared, calculate proportional fare with 25% extra
    return Math.ceil(baseFare * (seatsBooked / totalCapacity) * 1.25);
  } else {
    // If not shared, pay full fare
    return baseFare;
  }
};

// Book a new ride
exports.bookRide = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      rideType,
      scheduledTime,
      vehicleType,
      seatsRequired,
      isShared,
    } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (
      !pickupLocation ||
      !dropoffLocation ||
      !rideType ||
      !vehicleType ||
      !seatsRequired
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (rideType === "scheduled" && !scheduledTime) {
      return res
        .status(400)
        .json({ message: "Scheduled time is required for scheduled rides" });
    }

    // Validate pickup and dropoff locations
    if (
      !pickupLocation.name ||
      !pickupLocation.coordinates ||
      !dropoffLocation.name ||
      !dropoffLocation.coordinates
    ) {
      return res.status(400).json({ message: "Invalid location data" });
    }

    // Validate seats required based on vehicle type
    const vehicleCapacity =
      vehicleType === "e-rickshaw"
        ? 3
        : vehicleType === "cab"
        ? 4
        : vehicleType === "shuttle"
        ? 8
        : 0;

    if (seatsRequired <= 0 || seatsRequired > vehicleCapacity) {
      return res.status(400).json({
        message: `Invalid number of seats. Must be between 1 and ${vehicleCapacity} for ${vehicleType}`,
      });
    }

    // Calculate distance between pickup and dropoff
    const distance = calculateDistance(
      pickupLocation.coordinates.coordinates,
      dropoffLocation.coordinates.coordinates
    );

    // Calculate fare
    const fare = calculateFare(
      distance,
      vehicleType,
      seatsRequired,
      vehicleCapacity,
      isShared
    );

    let selectedDriver = null;
    let selectedVehicle = null;
    let parentRide = null;

    if (isShared) {
      // Find active rides that can be shared
      const rideTime =
        rideType === "scheduled" ? new Date(scheduledTime) : new Date();
      const timeBuffer = 10 * 60 * 1000; // 10 minutes in milliseconds

      const sharingCriteria = {
        status: "active",
        isShared: true,
        vehicleId: { $exists: true },
        $or: [
          // For on-demand rides
          {
            rideType: "on-demand",
            startTime: {
              $gte: new Date(Date.now() - timeBuffer),
              $lte: new Date(Date.now() + timeBuffer),
            },
          },
          // For scheduled rides
          {
            rideType: "scheduled",
            scheduledTime: {
              $gte: new Date(rideTime.getTime() - timeBuffer),
              $lte: new Date(rideTime.getTime() + timeBuffer),
            },
          },
        ],
      };

      // Find active shared rides with matching vehicle type
      const activeSharedRides = await Ride.find(sharingCriteria)
        .populate({
          path: "vehicleId",
          match: { type: vehicleType },
        })
        .populate("driverId")
        .exec();

      // Filter out rides where vehicle doesn't match (due to populate match)
      const validSharedRides = activeSharedRides.filter(
        (ride) => ride.vehicleId
      );

      // Find a ride that has enough remaining capacity
      for (const ride of validSharedRides) {
        const vehicle = ride.vehicleId;

        // Calculate total seats already booked in this vehicle
        const bookedSeatsCount = await Ride.aggregate([
          {
            $match: {
              $or: [{ _id: ride._id }, { parentRideId: ride._id }],
            },
          },
          {
            $group: {
              _id: null,
              totalSeats: { $sum: "$seatsBooked" },
            },
          },
        ]);

        const totalBookedSeats = bookedSeatsCount[0]?.totalSeats || 0;
        const remainingSeats = vehicle.capacity - totalBookedSeats;

        if (remainingSeats >= seatsRequired) {
          selectedDriver = ride.driverId;
          selectedVehicle = vehicle;
          parentRide = ride;
          break;
        }
      }

      // If no suitable shared ride found, return error
      if (!selectedDriver || !selectedVehicle) {
        return res.status(404).json({
          message:
            "No suitable shared rides available at this time. Please try again later or book a private ride.",
        });
      }
    } else {
      // For non-shared rides, find an available driver with the requested vehicle type
      const availableDrivers = await Driver.find({
        status: "available",
      })
        .populate({
          path: "vehicleId",
          match: {
            type: vehicleType,
            status: "active",
          },
        })
        .exec();

      // Filter out drivers where vehicle doesn't match (due to populate match)
      const validDrivers = availableDrivers.filter(
        (driver) => driver.vehicleId
      );

      if (validDrivers.length === 0) {
        return res.status(404).json({
          message: `No available ${vehicleType} found. Please try again later or choose a different vehicle type.`,
        });
      }

      // Select a random driver
      const randomIndex = Math.floor(Math.random() * validDrivers.length);
      selectedDriver = validDrivers[randomIndex];
      selectedVehicle = selectedDriver.vehicleId;

      // Update driver status to on_ride
      selectedDriver.status = "on_ride";
      await selectedDriver.save();
    }

    // Create the ride
    const newRide = new Ride({
      userId,
      driverId: selectedDriver._id,
      vehicleId: selectedVehicle._id,
      pickupLocation,
      dropoffLocation,
      rideType,
      scheduledTime: rideType === "scheduled" ? scheduledTime : undefined,
      startTime: rideType === "on-demand" ? new Date() : null,
      distance,
      fare,
      seatsBooked: seatsRequired,
      isShared,
      status: "active",
      paymentStatus: "pending",
      parentRideId: isShared && parentRide ? parentRide._id : null,
    });

    await newRide.save();

    // Return the ride details
    const populatedRide = await Ride.findById(newRide._id)
      .populate("driverId", "name phoneNumber rating")
      .populate("vehicleId", "type registrationNumber model capacity");

    res.status(201).json(populatedRide);
  } catch (err) {
    console.error("Error booking ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all rides for the current user
exports.getUserRides = async (req, res) => {
  try {
    const userId = req.user._id;

    const rides = await Ride.find({ userId })
      .sort("-createdAt")
      .populate("driverId", "name rating")
      .populate("vehicleId", "type registrationNumber model");

    res.json(rides);
  } catch (err) {
    console.error("Error fetching user rides:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a specific ride by ID
exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const ride = await Ride.findOne({ _id: id, userId })
      .populate("driverId", "name phoneNumber rating")
      .populate("vehicleId", "type registrationNumber model capacity");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json(ride);
  } catch (err) {
    console.error("Error fetching ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a ride
exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const ride = await Ride.findOne({ _id: id, userId });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Check if ride can be cancelled
    if (ride.status !== "active" && ride.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only active or pending rides can be cancelled" });
    }

    let refundAmount = 0;
    let refundReason = "";

    // Handle refund logic if payment was made
    if (ride.paymentStatus === "paid") {
      const user = await User.findById(userId);

      // Full refund if cancelled before ride starts
      if (!ride.startTime || ride.rideType === "scheduled") {
        refundAmount = ride.fare;
        refundReason = "Full refund - ride cancelled before start";
      } else {
        // No refund if cancelled after ride starts
        refundAmount = 0;
        refundReason = "No refund - ride already started";
      }

      if (refundAmount > 0) {
        user.walletBalance += refundAmount;
        ride.paymentStatus = "refunded";

        // Add transaction record
        user.walletTransactions.push({
          type: "refund",
          amount: refundAmount,
          description: refundReason,
          reservationId: ride._id,
        });

        await user.save();
      }
    }

    // Update ride status
    ride.status = "cancelled";
    await ride.save();

    // If this is not a shared ride or it's the parent ride of a shared ride, update driver status
    if (!ride.isShared || !ride.parentRideId) {
      // Check if this driver has any other active rides
      const otherActiveRides = await Ride.find({
        driverId: ride.driverId,
        _id: { $ne: ride._id },
        status: "active",
      });

      if (otherActiveRides.length === 0) {
        // Update driver status back to available
        await Driver.findByIdAndUpdate(ride.driverId, { status: "available" });
      }
    }

    res.json({
      message: "Ride cancelled successfully",
      ride,
      refundAmount,
    });
  } catch (err) {
    console.error("Error cancelling ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Complete a ride and process payment
exports.completeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user._id;

    const ride = await Ride.findOne({ _id: id, userId });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "active") {
      return res
        .status(400)
        .json({ message: "Only active rides can be completed" });
    }

    if (ride.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ message: "Payment has already been processed for this ride" });
    }

    // Process payment based on payment method
    const user = await User.findById(userId);

    if (paymentMethod === "wallet") {
      // Check if user has enough balance
      if (user.walletBalance < ride.fare) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct from wallet
      user.walletBalance -= ride.fare;

      // Add transaction record
      user.walletTransactions.push({
        type: "payment",
        amount: -ride.fare,
        description: `Payment for ride from ${ride.pickupLocation.name} to ${ride.dropoffLocation.name}`,
        reservationId: ride._id,
      });

      await user.save();
    }

    // Update ride status and payment status
    ride.status = "completed";
    ride.paymentStatus = "paid";
    ride.endTime = new Date();
    await ride.save();

    // If this is not a shared ride or it's the parent ride of a shared ride, update driver status
    if (!ride.isShared || !ride.parentRideId) {
      // Check if this driver has any other active rides
      const otherActiveRides = await Ride.find({
        driverId: ride.driverId,
        _id: { $ne: ride._id },
        status: "active",
      });

      if (otherActiveRides.length === 0) {
        // Update driver status back to available
        await Driver.findByIdAndUpdate(ride.driverId, { status: "available" });
      }
    }

    // Award random loyalty points (5-15% of fare)
    const minPercent = 5;
    const maxPercent = 15;
    const randomPercent =
      Math.floor(Math.random() * (maxPercent - minPercent + 1)) + minPercent;
    const pointsToAward = Math.round((ride.fare * randomPercent) / 100);

    if (pointsToAward > 0) {
      user.loyaltyPoints += pointsToAward;
      await user.save();
    }

    res.json({
      message: "Ride completed and payment processed successfully",
      ride,
      loyaltyPointsAwarded: pointsToAward,
    });
  } catch (err) {
    console.error("Error completing ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Check vehicle availability for a specific time
exports.checkVehicleAvailability = async (req, res) => {
  try {
    const { vehicleType, seatsRequired, isShared, rideType, scheduledTime } =
      req.query;

    if (!vehicleType || !seatsRequired) {
      return res
        .status(400)
        .json({ message: "Vehicle type and seats required are mandatory" });
    }

    const isSharedBool = isShared === "true";

    // Validate vehicle type
    if (!["e-rickshaw", "cab", "shuttle"].includes(vehicleType)) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    // Validate seats required
    const vehicleCapacity =
      vehicleType === "e-rickshaw"
        ? 3
        : vehicleType === "cab"
        ? 4
        : vehicleType === "shuttle"
        ? 8
        : 0;

    if (
      parseInt(seatsRequired) <= 0 ||
      parseInt(seatsRequired) > vehicleCapacity
    ) {
      return res.status(400).json({
        message: `Invalid number of seats. Must be between 1 and ${vehicleCapacity} for ${vehicleType}`,
      });
    }

    if (isSharedBool) {
      // Check for shared ride availability
      const rideTime =
        rideType === "scheduled" ? new Date(scheduledTime) : new Date();
      const timeBuffer = 10 * 60 * 1000; // 10 minutes in milliseconds

      const sharingCriteria = {
        status: "active",
        isShared: true,
        vehicleId: { $exists: true },
        $or: [
          // For on-demand rides
          {
            rideType: "on-demand",
            startTime: {
              $gte: new Date(Date.now() - timeBuffer),
              $lte: new Date(Date.now() + timeBuffer),
            },
          },
          // For scheduled rides
          {
            rideType: "scheduled",
            scheduledTime: {
              $gte: new Date(rideTime.getTime() - timeBuffer),
              $lte: new Date(rideTime.getTime() + timeBuffer),
            },
          },
        ],
      };

      // Find active shared rides with matching vehicle type
      const activeSharedRides = await Ride.find(sharingCriteria)
        .populate({
          path: "vehicleId",
          match: { type: vehicleType },
        })
        .populate("driverId")
        .exec();

      // Filter out rides where vehicle doesn't match (due to populate match)
      const validSharedRides = activeSharedRides.filter(
        (ride) => ride.vehicleId
      );

      // Check for available capacity in shared rides
      let availableSharedRide = null;

      for (const ride of validSharedRides) {
        const vehicle = ride.vehicleId;

        // Calculate total seats already booked in this vehicle
        const bookedSeatsCount = await Ride.aggregate([
          {
            $match: {
              $or: [{ _id: ride._id }, { parentRideId: ride._id }],
            },
          },
          {
            $group: {
              _id: null,
              totalSeats: { $sum: "$seatsBooked" },
            },
          },
        ]);

        const totalBookedSeats = bookedSeatsCount[0]?.totalSeats || 0;
        const remainingSeats = vehicle.capacity - totalBookedSeats;

        if (remainingSeats >= parseInt(seatsRequired)) {
          availableSharedRide = {
            rideId: ride._id,
            driver: {
              id: ride.driverId._id,
              name: ride.driverId.name,
            },
            vehicle: {
              id: vehicle._id,
              type: vehicle.type,
              registrationNumber: vehicle.registrationNumber,
              model: vehicle.model,
            },
            remainingSeats,
          };
          break;
        }
      }

      if (availableSharedRide) {
        return res.json({
          isAvailable: true,
          sharedRideAvailable: true,
          availableSharedRide,
        });
      } else {
        return res.json({
          isAvailable: false,
          sharedRideAvailable: false,
          message:
            "No suitable shared rides available at this time. Please try again later or book a private ride.",
        });
      }
    } else {
      // For non-shared rides, check for available drivers with the requested vehicle type
      const availableDrivers = await Driver.find({
        status: "available",
      })
        .populate({
          path: "vehicleId",
          match: {
            type: vehicleType,
            status: "active",
          },
        })
        .exec();

      // Filter out drivers where vehicle doesn't match (due to populate match)
      const validDrivers = availableDrivers.filter(
        (driver) => driver.vehicleId
      );

      return res.json({
        isAvailable: validDrivers.length > 0,
        availableVehiclesCount: validDrivers.length,
        message:
          validDrivers.length > 0
            ? `${validDrivers.length} ${vehicleType}(s) available`
            : `No available ${vehicleType} found. Please try again later or choose a different vehicle type.`,
      });
    }
  } catch (err) {
    console.error("Error checking vehicle availability:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a ride
exports.updateRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { isShared, fare } = req.body;
    const userId = req.user._id;

    const ride = await Ride.findOne({ _id: id, userId });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status !== "active") {
      return res
        .status(400)
        .json({ message: "Only active rides can be updated" });
    }

    // Update ride details
    ride.isShared = isShared;
    ride.fare = fare;

    await ride.save();

    // Return the updated ride details
    const updatedRide = await Ride.findById(id)
      .populate("driverId", "name phoneNumber rating")
      .populate("vehicleId", "type registrationNumber model capacity");

    res.json(updatedRide);
  } catch (err) {
    console.error("Error updating ride:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
