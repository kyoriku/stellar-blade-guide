const router = require('express').Router();
const userRoutes = require('./user-routes');
const collectiblesRoutes = require('./collectibles-routes');

router.use('/users', userRoutes);
router.use('/collectibles', collectiblesRoutes);

module.exports = router;
