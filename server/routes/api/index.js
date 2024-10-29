const router = require('express').Router();
const userRoutes = require('./user-routes');
const collectibleRoutes = require('./collectible-routes');
const commentRoutes = require('./comment-routes');

router.use('/users', userRoutes);
router.use('/collectibles', collectibleRoutes);
router.use('/comments', commentRoutes);

module.exports = router;
