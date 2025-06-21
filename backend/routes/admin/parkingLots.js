const express = require('express');
const router = express.Router();
const parkingLotController = require('../../controllers/parkingLotController');
const authMiddleware = require('../../middleware/auth');
const adminAuthMiddleware = require('../../middleware/adminAuth');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Create a new parking lot
router.post('/', parkingLotController.createParkingLot);

// Update a parking lot
router.put('/:id', parkingLotController.updateParkingLot);

// Delete a parking lot
router.delete('/:id', parkingLotController.deleteParkingLot);

module.exports = router;