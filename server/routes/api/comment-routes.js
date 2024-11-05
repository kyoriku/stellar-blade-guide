const router = require('express').Router();
const {
  getAllComments,
  getPageComments,
  getUserComments,
  createComment,
  updateComment,
  deleteComment,
  getModeratedComments
} = require('../../controllers/comment-controller');
const { authMiddleware } = require('../../utils/auth');
const { commentLimiter } = require('../../utils/rateLimiter');
const { sanitizeComment } = require('../../utils/sanitizer');
const { modMiddleware } = require('../../utils/modMiddleware');

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

router.route('/moderated')
  .get(authMiddleware, modMiddleware, getModeratedComments);

module.exports = router;

// const router = require('express').Router();
// const {
//   getAllComments,
//   getPageComments,
//   getUserComments,
//   createComment,
//   updateComment,
//   deleteComment,
//   getModeratedComments
// } = require('../../controllers/comment-controller');
// const { authMiddleware } = require('../../utils/auth');
// const { commentLimiter, generalLimiter } = require('../../utils/rateLimiter');
// const { sanitizeComment } = require('../../utils/sanitizer');
// const { modMiddleware } = require('../../utils/modMiddleware');

// // Public routes
// router.route('/')
//   .get(generalLimiter, getAllComments);

// router.route('/:pageId')
//   .get(generalLimiter, getPageComments);

// // Protected routes - require authentication
// router.route('/')
//   .post(authMiddleware, commentLimiter, sanitizeComment, createComment);

// router.route('/user')
//   .get(authMiddleware, generalLimiter, getUserComments);

// router.route('/:commentId')
//   .put(authMiddleware, generalLimiter, updateComment)
//   .delete(authMiddleware, generalLimiter, deleteComment);

// router.route('/moderated')
//   .get(authMiddleware, modMiddleware, generalLimiter, getModeratedComments);

// module.exports = router;
