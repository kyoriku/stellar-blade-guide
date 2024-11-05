const router = require('express').Router();
const userRoutes = require('./user-routes');
const collectibleRoutes = require('./collectible-routes');
const commentRoutes = require('./comment-routes');
const adminRoutes = require('./admin-routes');

router.use('/users', userRoutes);
router.use('/collectibles', collectibleRoutes);
router.use('/comments', commentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
