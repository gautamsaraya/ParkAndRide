const express = require('express');
const router = express.Router();
const parkingSlotController = require('../../controllers/parkingSlotController');
const authMiddleware = require('../../middleware/auth');
const adminAuthMiddleware = require('../../middleware/adminAuth');

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminAuthMiddleware);

// Create a new parking slot
router.post('/', parkingSlotController.createSlot);

// Create multiple parking slots at once
router.post('/bulk', parkingSlotController.createMultipleSlots);

// Update a parking slot
router.put('/:id', parkingSlotController.updateSlot);

// Delete a parking slot
router.delete('/:id', parkingSlotController.deleteSlot);

// Add a time restriction to a parking slot
router.post('/:id/time-restrictions', parkingSlotController.addTimeRestriction);

// Remove a time restriction from a parking slot
router.delete('/:id/time-restrictions/:restrictionIndex', parkingSlotController.removeTimeRestriction);

module.exports = router; 