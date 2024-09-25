const router = require('express').Router();
const {
  getAllCollectibles,
  getCollectiblesByLevelOrType,
  getCollectiblesByLevelAndLocation
} = require('../../controllers/collectible-controller');

// Route to get all collectibles
router.route('/').get(getAllCollectibles);

// Route to get collectibles by type or level
router.route('/:param').get(getCollectiblesByLevelOrType);

// Route to get collectibles by level and location
router.route('/:level/:location').get(getCollectiblesByLevelAndLocation)

module.exports = router;