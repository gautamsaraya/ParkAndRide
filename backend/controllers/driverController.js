const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Ride = require("../models/Ride");

// Get all drivers (Admin only)
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find()
      .populate("vehicleId", "type registrationNumber model capacity driverId")
      .sort("name");
    res.json(drivers);
  } catch (err) {
    console.error("Error fetching drivers:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single driver by ID (Admin only)
exports.getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate(
      "vehicleId",
      "type registrationNumber model capacity driverId"
    );

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    console.error("Error fetching driver:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new driver (Admin only)
exports.createDriver = async (req, res) => {
  try {
    const { name, phoneNumber, licenseNumber, vehicleId, status } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !licenseNumber || !vehicleId) {
      return res.status(400).json({
        message:
          "Name, phone number, license number, and vehicle ID are required",
      });
    }

    // Check if driver with this license number already exists
    const existingDriver = await Driver.findOne({ licenseNumber });
    if (existingDriver) {
      return res.status(400).json({
        message: "Driver with this license number already exists",
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if vehicle is already assigned to another driver
    if (vehicle.driverId) {
      const existingAssignment = await Driver.findById(vehicle.driverId);
      if (existingAssignment) {
        return res.status(400).json({
          message: "Vehicle is already assigned to another driver",
          driverId: existingAssignment._id,
          driverName: existingAssignment.name,
        });
      }
    }

    // Create the new driver
    const newDriver = new Driver({
      name,
      phoneNumber,
      licenseNumber,
      vehicleId,
      status: status || "available",
    });

    await newDriver.save();

    // Update the vehicle with the new driver's ID
    vehicle.driverId = newDriver._id;
    console.log(vehicle);
    await vehicle.save();

    // Fetch the updated driver with populated vehicle info
    const populatedDriver = await Driver.findById(newDriver._id).populate(
      "vehicleId",
      "type registrationNumber model capacity driverId"
    );

    res.status(201).json(populatedDriver);
  } catch (err) {
    console.error("Error creating driver:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a driver (Admin only)
exports.updateDriver = async (req, res) => {
  try {
    const { name, phoneNumber, licenseNumber, vehicleId, status } = req.body;
    const driverId = req.params.id;

    // Find the driver first
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Check if license number is being changed and if it already exists
    if (licenseNumber && licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ licenseNumber });
      if (existingDriver) {
        return res.status(400).json({
          message: "Driver with this license number already exists",
        });
      }
    }

    // Handle vehicle assignment changes
    if (vehicleId && vehicleId !== driver.vehicleId.toString()) {
      // Check if new vehicle exists
      const newVehicle = await Vehicle.findById(vehicleId);
      if (!newVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Check if new vehicle is already assigned to another driver
      if (newVehicle.driverId && newVehicle.driverId.toString() !== driverId) {
        const existingAssignment = await Driver.findById(newVehicle.driverId);
        if (existingAssignment) {
          return res.status(400).json({
            message: "Vehicle is already assigned to another driver",
            driverId: existingAssignment._id,
            driverName: existingAssignment.name,
          });
        }
      }

      // Remove driver ID from old vehicle
      const oldVehicle = await Vehicle.findById(driver.vehicleId);
      if (oldVehicle) {
        oldVehicle.driverId = null;
        await oldVehicle.save();
      }

      // Assign driver ID to new vehicle
      newVehicle.driverId = driverId;
      await newVehicle.save();
    }

    // Check if driver is on ride and status is being changed to offline
    if (status === "offline" && driver.status === "on_ride") {
      const activeRide = await Ride.findOne({
        driverId,
        status: { $in: ["pending", "active"] },
      });

      if (activeRide) {
        return res.status(400).json({
          message:
            "Cannot change driver status to offline while on active ride",
          rideId: activeRide._id,
        });
      }
    }

    // Update fields
    if (name) driver.name = name;
    if (phoneNumber) driver.phoneNumber = phoneNumber;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (vehicleId) driver.vehicleId = vehicleId;
    if (status) driver.status = status;

    await driver.save();

    // Return populated driver data
    const updatedDriver = await Driver.findById(driverId).populate(
      "vehicleId",
      "type registrationNumber model capacity driverId"
    );

    res.json(updatedDriver);
  } catch (err) {
    console.error("Error updating driver:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a driver (Admin only)
exports.deleteDriver = async (req, res) => {
  try {
    const driverId = req.params.id;

    // Find the driver first
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Check if driver has active rides
    const activeRides = await Ride.find({
      driverId,
      status: { $in: ["pending", "active"] },
    });

    if (activeRides.length > 0) {
      return res.status(400).json({
        message: "Cannot delete driver with active rides",
        activeRidesCount: activeRides.length,
      });
    }

    // Remove driver ID from assigned vehicle
    if (driver.vehicleId) {
      const vehicle = await Vehicle.findById(driver.vehicleId);
      if (vehicle) {
        vehicle.driverId = null;
        await vehicle.save();
      }
    }

    await Driver.findByIdAndDelete(driverId);

    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("Error deleting driver:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
