const router = require('express').Router();
const {
  getAllEidos9Collectibles,
  getFallenOverpass,
  getSubmergedCity,
  getAtelier,
} = require('../../../controllers/collectibles/eidos-9-controller');

// Route to get all Eidos 9 collectibles
router.route('/').get(getAllEidos9Collectibles);

// Routes to get Eidos 9 collectibles
router.route('/fallen-overpass').get(getFallenOverpass);
router.route('/submerged-city').get(getSubmergedCity);
router.route('/atelier').get(getAtelier);

module.exports = router;
