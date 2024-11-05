const { User } = require('../models');

module.exports = {
  async getAllUsers(req, res) {
    try {
      // Check if the requesting user is kyoriku
      if (req.user.username !== 'kyoriku') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const users = await User.find({}, 'username email isModerator');
      res.json(users);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
  },

  async toggleModeratorStatus(req, res) {
    try {
      // Check if the requesting user is kyoriku
      if (req.user.username !== 'kyoriku') {
        console.log(`Unauthorized access attempt by user: ${req.user.username}`);
        return res.status(403).json({ message: 'Not authorized' });
      }

      const { userId } = req.params;
      console.log('Attempting to toggle moderator status for user:', userId);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Toggle the moderator status
      user.isModerator = !user.isModerator;
      await user.save();

      console.log('Successfully toggled moderator status:', user.username, user.isModerator);

      res.json({
        userId: user._id,
        username: user.username,
        isModerator: user.isModerator
      });
    } catch (error) {
      console.error('Error in toggleModeratorStatus:', error);
      res.status(500).json({ message: 'Error updating moderator status', error: error.message });
    }
  }
};