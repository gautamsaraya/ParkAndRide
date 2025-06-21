const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Get user profile
router.get('/me', auth, userController.getUserProfile);

// Wallet routes
router.post('/wallet/add', auth, userController.addWalletBalance);
router.post('/wallet/redeem-points', auth, userController.redeemLoyaltyPoints);
router.get('/wallet/transactions', auth, userController.getWalletTransactions);

module.exports = router;
