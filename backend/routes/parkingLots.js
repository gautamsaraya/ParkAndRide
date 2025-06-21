const express = require('express');
const router = express.Router();
const parkingLotController = require('../controllers/parkingLotController');
const parkingSlotController = require('../controllers/parkingSlotController');
const authMiddleware = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

// Get all parking lots
router.get('/', parkingLotController.getAllParkingLots);

// Get a specific parking lot
router.get('/:id', parkingLotController.getParkingLotById);

// Get parking lots by metro station
router.get('/by-station/:metroStationId', parkingLotController.getParkingLotsByMetroStation);

// Get parking slots for a specific lot
router.get('/:lotId/slots', parkingLotController.getParkingSlots);

// Check availability of parking slots for a specific time range
router.get('/:lotId/availability', parkingLotController.checkAvailability);

// Check availability of a specific parking slot for a given time period
router.get('/slots/:id/availability', parkingSlotController.checkSlotAvailability);

module.exports = router; 