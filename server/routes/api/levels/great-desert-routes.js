const router = require('express').Router();
const {
  getAllGreatDesertCollectibles,
  getSolarTower,
  getCollapsedOverpass,
  getBuriedRuins,
  getCentralGreatDesert,
  getNorthernGreatDesert,
  getOasis
} = require('../../../controllers/collectibles/great-desert-controller');

// Route to get all Great Desert collectibles
router.route('/').get(getAllGreatDesertCollectibles);

// Routes to get Great Desert collectibles
router.route('/solar-tower').get(getSolarTower);
router.route('/collapsed-overpass').get(getCollapsedOverpass);
router.route('/buried-ruins').get(getBuriedRuins);
router.route('/central-great-desert').get(getCentralGreatDesert);
router.route('/northern-great-desert').get(getNorthernGreatDesert);
router.route('/oasis').get(getOasis);

module.exports = router;
