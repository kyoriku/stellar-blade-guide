const router = require('express').Router();
const {
  getAllWastelandCollectibles,
  getBarrenLands,
  getGreatCanyon,
  getScrapPlains,
  getOilStorageFacility,
  getScrapYard,
  getWastelandBasin,
  getScrapPlainsContinued,
  getPlant,
  getGreatCanyonContinued,
  getForbiddenArea,
  getWastelandContinued
} = require('../../../controllers/collectibles/wasteland-controller');

// Route to get all Wasteland collectibles
router.route('/').get(getAllWastelandCollectibles);

// Routes to get Wasteland collectibles
router.route('/barren-lands').get(getBarrenLands);
router.route('/great-canyon').get(getGreatCanyon);
router.route('/scrap-plains').get(getScrapPlains);
router.route('/oil-storage-facility').get(getOilStorageFacility);
router.route('/scrap-yard').get(getScrapYard);
router.route('/wasteland-basin').get(getWastelandBasin);
router.route('/scrap-plains-continued').get(getScrapPlainsContinued);
router.route('/plant').get(getPlant);
router.route('/great-canyon-continued').get(getGreatCanyonContinued);
router.route('/forbidden-area').get(getForbiddenArea);
router.route('/wasteland-continued').get(getWastelandContinued);