const express = require('express');
const router = express.Router();
const metroStationController = require('../../controllers/metroStationController');
const authMiddleware = require('../../middleware/auth');
const adminAuthMiddleware = require('../../middleware/adminAuth');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Create a new metro station
router.post('/', metroStationController.createStation);

// Update a metro station
router.put('/:id', metroStationController.updateStation);

// Delete a metro station
router.delete('/:id', metroStationController.deleteStation);

module.exports = router; 