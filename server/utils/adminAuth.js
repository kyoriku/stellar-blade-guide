const adminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated and is the admin (kyoriku)
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    if (req.user.username !== 'kyoriku') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};