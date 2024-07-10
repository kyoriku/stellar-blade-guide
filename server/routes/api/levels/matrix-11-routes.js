const router = require('express').Router();
const {
  getAllMatrix11Collectibles,
  getClosedOffPlatform,
  getLandfill,
  getCollapsedRailBridge,
  getUndergroundSewer,
  getRottenLabyrinth,
  getTemporaryArmoury,
  getTrainGraveyard,
} = require('../../../controllers/collectibles/matrix-11-controller');

// Route to get all Matrix 11 collectibles
router.route('/').get(getAllMatrix11Collectibles);

// Routes to get Matrix 11 collectibles
router.route('/closed-off-platform').get(getClosedOffPlatform);
router.route('/landfill').get(getLandfill);
router.route('/collapsed-rail-bridge').get(getCollapsedRailBridge);
router.route('/underground-sewer').get(getUndergroundSewer);
router.route('/rotten-labyrinth').get(getRottenLabyrinth);
router.route('/temporary-armoury').get(getTemporaryArmoury);
router.route('/train-graveyard').get(getTrainGraveyard);

module.exports = router;
