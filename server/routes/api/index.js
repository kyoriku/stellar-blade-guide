const router = require('express').Router();
const userRoutes = require('./user-routes');
const collectibleRoutes = require('./collectible-routes');

router.use('/users', userRoutes);
router.use('/collectibles', collectibleRoutes);

module.exports = router;
