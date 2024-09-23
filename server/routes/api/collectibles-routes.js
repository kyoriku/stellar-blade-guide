const router = require('express').Router();
const { getAllCollectibles } = require('../../controllers/collectibles-controller');
const { 
  getBetaCores, 
  getBodyCores, 
  getCamps, 
  getCans, 
  getDocuments, 
  getDronePacks, 
  getEarrings, 
  getExospines,
  getNanoSuits,
  getMemorysticks,
  getPasscodes,
} = require('../../controllers/collectibles/type-controller');
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

// Routes to get collectibles from levels
router.use('/eidos-7', eidos7Routes);
router.use('/xion', xionRoutes);
router.use('/wasteland', wastelandRoutes);
router.use('/altess-levoire', altessLevoireRoutes);
router.use('/matrix-11', matrix11Routes);
router.use('/great-desert', greatDesertRoutes);
router.use('/abyss-levoire', abyssLevoireRoutes);
router.use('/eidos-9', eidos9Routes);
router.use('/spire-4', spire4Routes);

// Routes to get collectibles by type
router.route('/beta-cores').get(getBetaCores);
router.route('/body-cores').get(getBodyCores);
router.route('/camps').get(getCamps);
router.route('/cans').get(getCans);
router.route('/documents').get(getDocuments);
router.route('/drone-packs').get(getDronePacks);
router.route('/earrings').get(getEarrings);
router.route('/exospines').get(getExospines);
router.route('/nano-suits').get(getNanoSuits);
router.route('/memorysticks').get(getMemorysticks);
router.route('/passcodes').get(getPasscodes);

module.exports = router;
