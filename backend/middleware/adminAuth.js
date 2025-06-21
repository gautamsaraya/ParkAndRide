const User = require('../models/User');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    // The auth middleware should have already set req.user
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if the user has admin role
    // We need to fetch the full user document to check the isAdmin field
    const user = await User.findById(req.user._id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Admin authorization error:', err.message);
    return res.status(500).json({ message: 'Server error during authorization' });
  }
};

module.exports = adminAuthMiddleware; 