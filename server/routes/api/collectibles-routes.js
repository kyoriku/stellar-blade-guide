const router = require('express').Router();
// const { getAllCollectibles, getCollectiblesByType } = require('../../controllers/collectibles-controller');
const { getAllCollectibles, getCollectiblesByType, getCollectiblesByLevelAndLocation, getCollectiblesByLocation } = require('../../controllers/collectibles-controller');
const eidos7Routes = require('./levels/eidos-7-routes');
const xionRoutes = require('./levels/xion-routes');
const wastelandRoutes = require('./levels/wasteland-routes');
const altessLevoireRoutes = require('./levels/altess-levoire-routes');
const matrix11Routes = require('./levels/matrix-11-routes');
const greatDesertRoutes = require('./levels/great-desert-routes');
const abyssLevoireRoutes = require('./levels/abyss-levoire-routes');
const eidos9Routes = require('./levels/eidos-9-routes');
const spire4Routes = require('./levels/spire-4-routes');

// Route to get all collectibles
router.route('/').get(getAllCollectibles);
router.route('/:type').get(getCollectiblesByType);

// Routes to get collectibles from levels
// router.use('/eidos-7', eidos7Routes);
router.use('/xion', xionRoutes);
router.use('/wasteland', wastelandRoutes);
router.use('/altess-levoire', altessLevoireRoutes);
router.use('/matrix-11', matrix11Routes);
router.use('/great-desert', greatDesertRoutes);
router.use('/abyss-levoire', abyssLevoireRoutes);
router.use('/eidos-9', eidos9Routes);
router.use('/spire-4', spire4Routes);

module.exports = router;

//////////////////////////

// const router = require('express').Router();
// const { getAllCollectibles, getCollectiblesByType, getCollectiblesByLevelAndLocation, getCollectiblesByLocation } = require('../../controllers/collectibles-controller');

// // Route to get all collectibles
// router.route('/').get(getAllCollectibles);

// // Route to get collectibles by type
// router.route('/:type').get(getCollectiblesByType);

// // Route to get collectibles by level and location
router.route('/:level/:location').get(getCollectiblesByLevelAndLocation);

// Route to get collectibles by location only
router.route('/eidos-7/:location').get(getCollectiblesByLocation);

// module.exports = router;
