const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const authMiddleware = require("../middleware/auth");

// All routes are protected
router.use(authMiddleware);

// Book a new ride
router.post("/", rideController.bookRide);

// Get all rides for the current user
router.get("/", rideController.getUserRides);

// Check vehicle availability
router.get("/check-availability", rideController.checkVehicleAvailability);

// Get a specific ride
router.get("/:id", rideController.getRideById);

// Update a ride
router.put("/:id", rideController.updateRide);

// Cancel a ride
router.put("/:id/cancel", rideController.cancelRide);

// Complete a ride and process payment
router.put("/:id/complete", rideController.completeRide);

module.exports = router;
