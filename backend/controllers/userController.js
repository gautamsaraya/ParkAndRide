const User = require('../models/User');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add money to wallet
exports.addWalletBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add the amount to wallet balance
    user.walletBalance += amount;
    
    // Add transaction record
    user.walletTransactions.push({
      type: 'deposit',
      amount,
      description: 'Added money to wallet'
    });
    
    await user.save();
    
    res.json({
      message: 'Money added to wallet successfully',
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error('Error adding wallet balance:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Redeem loyalty points for wallet balance
exports.redeemLoyaltyPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.loyaltyPoints <= 0) {
      return res.status(400).json({ message: 'No loyalty points to redeem' });
    }
    
    // Calculate wallet amount (20% of loyalty points)
    const redeemAmount = Math.round(user.loyaltyPoints * 0.2);
    
    // Add to wallet balance
    user.walletBalance += redeemAmount;
    
    // Add transaction record
    user.walletTransactions.push({
      type: 'loyalty_redemption',
      amount: redeemAmount,
      description: `Redeemed ${user.loyaltyPoints} loyalty points`
    });
    
    // Reset loyalty points
    const previousPoints = user.loyaltyPoints;
    user.loyaltyPoints = 0;
    
    await user.save();
    
    res.json({
      message: 'Loyalty points redeemed successfully',
      pointsRedeemed: previousPoints,
      amountCredited: redeemAmount,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error('Error redeeming loyalty points:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get wallet transaction history
exports.getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('walletTransactions');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Sort transactions by timestamp (newest first)
    const transactions = user.walletTransactions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching wallet transactions:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 