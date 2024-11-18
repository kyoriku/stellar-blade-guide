// server/utils/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');  // Add this
require('dotenv').config();

const secret = process.env.TOKEN_SECRET;
const expiration = '2h';

module.exports = {
  authMiddleware: async function (req, res, next) {
    let token = req.query.token || req.headers.authorization;

    if (req.headers.authorization) {
      token = token.split(' ').pop().trim();
    }

    if (!token) {
      return res.status(401).json({ message: 'You have no token!' });
    }

    try {
      // Verify token
      const { data } = jwt.verify(token, secret, { maxAge: expiration });
      
      // Get fresh user data from database
      const freshUser = await User.findById(data._id).select('-password');
      if (!freshUser) {
        return res.status(401).json({ message: 'Invalid user!' });
      }

      // Update user data with fresh moderator status
      req.user = {
        _id: freshUser._id,
        username: freshUser.username,
        email: freshUser.email,
        isModerator: freshUser.isModerator,
        isAdmin: freshUser.isAdmin
      };

      next();
    } catch (err) {
      console.log('Invalid token:', err);
      return res.status(401).json({ message: 'Invalid token!' });
    }
  },

  signToken: function ({ username, email, _id, isModerator, isAdmin }) {
    const payload = { username, email, _id, isModerator, isAdmin };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
};