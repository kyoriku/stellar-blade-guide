const router = require('express').Router();
const {
  getAllComments,
  getPageComments,
  getUserComments,
  createComment,
  updateComment,
  deleteComment
} = require('../../controllers/comment-controller');
const { authMiddleware } = require('../../utils/auth');
const { commentLimiter } = require('../../utils/rateLimiter');
const { sanitizeComment } = require('../../utils/sanitizer');

// Public routes
router.route('/')
  .get(getAllComments);

router.route('/:pageId')
  .get(getPageComments);

// Protected routes - require authentication
router.route('/')
  .post(authMiddleware, commentLimiter, sanitizeComment, createComment);

router.route('/user')
  .get(authMiddleware, getUserComments);

router.route('/:commentId')
  .put(authMiddleware, updateComment)
  .delete(authMiddleware, deleteComment);

module.exports = router;