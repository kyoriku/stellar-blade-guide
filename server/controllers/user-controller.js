const { User } = require('../models');
const { signToken } = require('../utils/auth');

module.exports = {
  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving current user', error });
    }
  },
  
  async getSingleUser({ user = null, params }, res) {
    try {
      const foundUser = await User.findOne({
        $or: [{ _id: user ? user._id : params.id }, { username: params.username }],
      });

      if (!foundUser) {
        return res.status(400).json({ message: 'Cannot find a user with this id!' });
      }

      res.json(foundUser);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving user', error });
    }
  },

  async createUser({ body }, res) {
    try {
      const user = await User.create(body);
      const token = signToken(user);
      res.json({ token, user });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = {};
        Object.keys(error.errors).forEach((field) => {
          errors[field] = error.errors[field].message;
        });
        return res.status(400).json({ message: 'User validation failed', errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async login({ body }, res) {
    try {
      const user = await User.findOne({ $or: [{ username: body.username }, { email: body.email }] });
      if (!user) {
        return res.status(400).json({ message: "Can't find this user" });
      }
  
      const correctPw = await user.isCorrectPassword(body.password);
  
      if (!correctPw) {
        return res.status(400).json({ message: 'Wrong password!' });
      }
  
      const token = signToken({
        username: user.username,
        email: user.email,
        _id: user._id,
        isModerator: user.isModerator
      });
  
      res.json({ 
        token, 
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isModerator: user.isModerator
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async toggleModeratorStatus(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify that the requesting user is an admin (kyoriku)
      if (req.user.username !== 'kyoriku') {
        return res.status(403).json({ message: 'Not authorized to modify moderator status' });
      }

      user.isModerator = !user.isModerator;
      await user.save();

      res.json({
        userId: user._id,
        username: user.username,
        isModerator: user.isModerator
      });
    } catch (err) {
      console.error('Error toggling moderator status:', err);
      res.status(500).json({ message: 'Error updating moderator status' });
    }
  }
};