const express = require("express");
const router = express.Router();
const vehicleController = require("../../controllers/vehicleController");
const authMiddleware = require("../../middleware/auth");
const adminAuthMiddleware = require("../../middleware/adminAuth");

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Get all vehicles
router.get("/", vehicleController.getAllVehicles);

// Get a specific vehicle
router.get("/:id", vehicleController.getVehicleById);

// Get vehicles by metro station
router.get("/by-station/:stationId", vehicleController.getVehiclesByStation);

// Create a new vehicle
router.post("/", vehicleController.createVehicle);

// Update a vehicle
router.put("/:id", vehicleController.updateVehicle);

// Delete a vehicle
router.delete("/:id", vehicleController.deleteVehicle);

module.exports = router;
