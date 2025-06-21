const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

// Create a new reservation
router.post('/', reservationController.createReservation);

// Get all reservations for the current user
router.get('/', reservationController.getUserReservations);

// Get a specific reservation
router.get('/:id', reservationController.getReservationById);

// Cancel a reservation
router.put('/:id/cancel', reservationController.cancelReservation);

// Complete payment for a reservation
router.put('/:id/payment', reservationController.completePayment);

// Update reservation time
router.put('/:id/update-time', reservationController.updateReservationTime);

module.exports = router; 