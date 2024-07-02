const router = require('express').Router();
const { 
  getAllXionCollectibles,
  getXion,
  getXionContinued 
} = require('../../../controllers/collectibles/xion-controller');

// Route to get all Xion collectibles
router.route('/').get(getAllXionCollectibles);

// Routes to get Xion collectibles
router.route('/xion').get(getXion);
router.route('/xion-continued').get(getXionContinued);

module.exports = router;