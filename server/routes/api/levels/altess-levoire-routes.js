const router = require('express').Router();
const {
  getAllAltessLevoireCollectibles,
  getResearchLab,
  getSectorA07,
  getSpecimenResearchLab,
  getTopSecretResearchComplex
} = require('../../../controllers/collectibles/altess-levoire-controller');

// Route to get all Altess Levoire collectibles
router.route('/').get(getAllAltessLevoireCollectibles);

// Routes to get Altess Levoire collectibles
router.route('/research-lab').get(getResearchLab);
router.route('/sector-a07').get(getSectorA07);
router.route('/specimen-research-lab').get(getSpecimenResearchLab);
router.route('/top-secret-research-complex').get(getTopSecretResearchComplex);

module.exports = router;