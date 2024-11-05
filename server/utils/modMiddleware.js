const { AuthenticationError } = require('./errors');

const modMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isModerator) {
      throw new AuthenticationError('Must be a moderator to perform this action');
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Not authorized as moderator' });
  }
};

module.exports = { modMiddleware };