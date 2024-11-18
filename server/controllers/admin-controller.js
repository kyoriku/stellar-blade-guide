const { User } = require('../models');

module.exports = {
  async getAllUsers(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const users = await User.find({}, 'username email isModerator isAdmin');
      res.json(users);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
  },

  async toggleModeratorStatus(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isModerator = !user.isModerator;
      await user.save();

      res.json({
        userId: user._id,
        username: user.username,
        isModerator: user.isModerator,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Error in toggleModeratorStatus:', error);
      res.status(500).json({ message: 'Error updating moderator status', error: error.message });
    }
  }
};