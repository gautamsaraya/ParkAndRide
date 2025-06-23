const express = require("express");
const router = express.Router();
const driverController = require("../../controllers/driverController");
const authMiddleware = require("../../middleware/auth");
const adminAuthMiddleware = require("../../middleware/adminAuth");

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Get all drivers
router.get("/", driverController.getAllDrivers);

// Get a specific driver
router.get("/:id", driverController.getDriverById);

// Create a new driver
router.post("/", driverController.createDriver);

// Update a driver
router.put("/:id", driverController.updateDriver);

// Delete a driver
router.delete("/:id", driverController.deleteDriver);

module.exports = router;
