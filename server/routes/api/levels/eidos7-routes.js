const router = require('express').Router();
const {
  getAllEidos7Collectibles,
  getSilentStreet,
  getParkingTower,
  getAbandonedStation,
  getFloodedCommercialSector,
  getMemoryTower,
  getConstructionZone,
  getCityUnderground,
  getCrater,
  getEidos7Continued
} = require('../../../controllers/collectibles-controller');

// const { authMiddleware } = require('../../../utils/auth');

// Route to get all Eidos 7 collectibles
router.route('/').get(getAllEidos7Collectibles);

// Routes to get Eidos 7 collectibles
router.route('/silent-street').get(getSilentStreet);
router.route('/parking-tower').get(getParkingTower);
router.route('/abandoned-station').get(getAbandonedStation);
router.route('/flooded-commercial-sector').get(getFloodedCommercialSector);
router.route('/memory-tower').get(getMemoryTower);
router.route('/construction-zone').get(getConstructionZone);
router.route('/city-underground').get(getCityUnderground);
router.route('/crater').get(getCrater);
router.route('/eidos-7-continued').get(getEidos7Continued);

// Routes to get Xion collectibles
// Routes to get Wasteland collectibles
// Routes to get Altess Levoire collectibles
// Routes to get Matrix 11 collectibles
// Routes to get Great Desert collectibles
// Routes to get Abyss Levoire collectibles
// Routes to get Eidos 9 collectibles
// Routes to get Spire 4 collectibles

module.exports = router;