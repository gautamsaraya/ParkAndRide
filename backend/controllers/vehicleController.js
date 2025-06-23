const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const MetroStation = require("../models/MetroStation");
const Ride = require("../models/Ride");

// Get all vehicles (Admin only)
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("baseStationId", "name")
      .sort("type registrationNumber");
    res.json(vehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single vehicle by ID (Admin only)
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "baseStationId",
      "name"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if vehicle is assigned to a driver
    const driver = await Driver.findOne({ vehicleId: req.params.id });

    res.json({
      ...vehicle.toObject(),
      assignedDriver: driver
        ? {
            id: driver._id,
            name: driver.name,
            status: driver.status,
          }
        : null,
    });
  } catch (err) {
    console.error("Error fetching vehicle:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get vehicles by metro station (Admin only)
exports.getVehiclesByStation = async (req, res) => {
  try {
    const { stationId } = req.params;

    // Check if station exists
    const station = await MetroStation.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Metro station not found" });
    }

    const vehicles = await Vehicle.find({ baseStationId: stationId }).sort(
      "type registrationNumber"
    );

    res.json(vehicles);
  } catch (err) {
    console.error("Error fetching vehicles by station:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new vehicle (Admin only)
exports.createVehicle = async (req, res) => {
  try {
    const { type, registrationNumber, model, capacity, status, baseStationId } =
      req.body;

    // Validate required fields
    if (!type || !registrationNumber || !model || !baseStationId) {
      return res.status(400).json({
        message:
          "Type, registration number, model, and base station ID are required",
      });
    }

    // Check if vehicle with this registration number already exists
    const existingVehicle = await Vehicle.findOne({ registrationNumber });
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle with this registration number already exists",
      });
    }

    // Check if base station exists
    const station = await MetroStation.findById(baseStationId);
    if (!station) {
      return res.status(404).json({ message: "Base station not found" });
    }

    // Set capacity based on vehicle type if not provided
    let vehicleCapacity = capacity;
    if (!vehicleCapacity) {
      switch (type) {
        case "e-rickshaw":
          vehicleCapacity = 3;
          break;
        case "cab":
          vehicleCapacity = 4;
          break;
        case "shuttle":
          vehicleCapacity = 8;
          break;
        default:
          vehicleCapacity = 1;
      }
    }

    const newVehicle = new Vehicle({
      type,
      registrationNumber,
      model,
      capacity: vehicleCapacity,
      status: status || "active",
      baseStationId,
    });

    await newVehicle.save();

    res.status(201).json(newVehicle);
  } catch (err) {
    console.error("Error creating vehicle:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a vehicle (Admin only)
exports.updateVehicle = async (req, res) => {
  try {
    const { type, registrationNumber, model, capacity, status, baseStationId } =
      req.body;
    const vehicleId = req.params.id;

    // Find the vehicle first
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if registration number is being changed and if it already exists
    if (
      registrationNumber &&
      registrationNumber !== vehicle.registrationNumber
    ) {
      const existingVehicle = await Vehicle.findOne({ registrationNumber });
      if (existingVehicle) {
        return res.status(400).json({
          message: "Vehicle with this registration number already exists",
        });
      }
    }

    // Check if base station is being changed
    if (baseStationId && baseStationId !== vehicle.baseStationId.toString()) {
      // Check if base station exists
      const station = await MetroStation.findById(baseStationId);
      if (!station) {
        return res.status(404).json({ message: "Base station not found" });
      }
    }

    // Check if vehicle is in use and status is being changed to inactive or maintenance
    if (
      (status === "inactive" || status === "maintenance") &&
      vehicle.status === "active"
    ) {
      // Check if vehicle is assigned to a driver
      const driver = await Driver.findOne({ vehicleId });
      if (driver && driver.status === "on_ride") {
        return res.status(400).json({
          message:
            "Cannot change vehicle status while it is in use by a driver on a ride",
          driverId: driver._id,
          driverName: driver.name,
        });
      }

      // Check if vehicle has pending or active rides
      const activeRides = await Ride.find({
        vehicleId,
        status: { $in: ["pending", "active"] },
      });

      if (activeRides.length > 0) {
        return res.status(400).json({
          message: "Cannot change vehicle status while it has active rides",
          activeRidesCount: activeRides.length,
        });
      }
    }

    // Update fields
    if (type) vehicle.type = type;
    if (registrationNumber) vehicle.registrationNumber = registrationNumber;
    if (model) vehicle.model = model;
    if (capacity) vehicle.capacity = capacity;
    if (status) vehicle.status = status;
    if (baseStationId) vehicle.baseStationId = baseStationId;

    await vehicle.save();

    res.json(vehicle);
  } catch (err) {
    console.error("Error updating vehicle:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a vehicle (Admin only)
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;

    // Find the vehicle first
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Check if vehicle is assigned to a driver
    const driver = await Driver.findOne({ vehicleId });
    if (driver) {
      return res.status(400).json({
        message: "Cannot delete vehicle assigned to a driver",
        driverId: driver._id,
        driverName: driver.name,
      });
    }

    // Check if vehicle has active rides
    const activeRides = await Ride.find({
      vehicleId,
      status: { $in: ["pending", "active"] },
    });

    if (activeRides.length > 0) {
      return res.status(400).json({
        message: "Cannot delete vehicle with active rides",
        activeRidesCount: activeRides.length,
      });
    }

    await Vehicle.findByIdAndDelete(vehicleId);

    res.json({ message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error("Error deleting vehicle:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
