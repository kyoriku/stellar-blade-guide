const router = require('express').Router();
const {
  getAllAltessLevoireCollectibles,
  getResearchLabEntrance,
  getPurificationScanner,
  getSecurityCenter,
  getSectorA07,
  getSpecimenPreservationLab,
  getTopSecretResearchComplex,
  getDeterioratedLobby,
  getAirVent
} = require('../../../controllers/collectibles/altess-levoire-controller');

// Route to get all Altess Levoire collectibles
router.route('/').get(getAllAltessLevoireCollectibles);

// Routes to get Altess Levoire collectibles
router.route('/research-lab-entrance').get(getResearchLabEntrance);
router.route('/purification-scanner').get(getPurificationScanner);
router.route('/security-center').get(getSecurityCenter);
router.route('/sector-a07').get(getSectorA07);
router.route('/specimen-preservation-lab').get(getSpecimenPreservationLab);
router.route('/top-secret-research-complex').get(getTopSecretResearchComplex);
router.route('/deteriorated-lobby').get(getDeterioratedLobby);
router.route('/air-vent').get(getAirVent);

module.exports = router;
