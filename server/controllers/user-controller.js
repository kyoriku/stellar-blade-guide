const { User } = require('../models');
const { signToken } = require('../utils/auth');

module.exports = {
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
        // Create an object with error messages keyed by field
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
  
      // Create token with specific user data
      const token = signToken({
        username: user.username,
        email: user.email,
        _id: user._id,
        isModerator: user.isModerator
      });
  
      // Send back structured user data
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
};
