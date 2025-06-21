const express = require('express');
const router = express.Router();
const metroStationController = require('../controllers/metroStationController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/search', metroStationController.searchStations);
router.get('/nearby', metroStationController.getNearbyStations);

// Protected routes
router.get('/', authMiddleware, metroStationController.getAllStations);
router.get('/:id', authMiddleware, metroStationController.getStationById);

module.exports = router; 