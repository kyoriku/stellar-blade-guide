const router = require('express').Router();
const {
  getAllUsers,
  toggleModeratorStatus
} = require('../../controllers/admin-controller');

// import middleware
const { authMiddleware } = require('../../utils/auth');

// All admin routes require authentication
router.use(authMiddleware);

// Get all users
router.route('/users').get(getAllUsers);

// Toggle moderator status
router.route('/users/:userId/toggle-moderator').patch(toggleModeratorStatus);

module.exports = router;