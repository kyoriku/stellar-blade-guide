const router = require('express').Router();
const {
  getCurrentUser,
  createUser,
  getSingleUser,
  login,
  toggleModeratorStatus // Add this to the imports
} = require('../../controllers/user-controller');
const { User } = require('../../models');
const { authMiddleware, signToken } = require('../../utils/auth');

// put authMiddleware anywhere we need to send a token for verification of user
router.route('/')
  .post(createUser);

router.route('/login')
  .post(login);

router.route('/me')
  .get(authMiddleware, getCurrentUser);

// Update the toggle moderator route to use the imported function directly
router.route('/admin/users/:userId/toggle-moderator')
  .patch(authMiddleware, toggleModeratorStatus);

// Add the refresh token route before the module.exports
router.route('/refresh-token')
  .post(authMiddleware, async (req, res) => {
    try {
      // Get fresh user data from database
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate new token with updated user data
      const token = signToken({
        username: user.username,
        email: user.email,
        _id: user._id,
        isModerator: user.isModerator
      });

      res.json({ token });
    } catch (err) {
      console.error('Error refreshing token:', err);
      res.status(500).json({ message: 'Error refreshing token' });
    }
  });

module.exports = router;