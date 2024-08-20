const router = require('express').Router();
const {
  getAllSpire4Collectibles,
  getOrcaSpaceComplex,
  getHypertube,
  getSpaceLogisticsComplex,
  getRaphaelSpaceCentre,
  getCargoLift121,
  getMaintenanceSector,
  getTowerOuterWall,
  getPassengerLift161,
  getPrestigeLounge,
  getVermillionGarden,
  getHighOrbitStation,
  getNest
} = require('../../../controllers/collectibles/spire-4-controller');

// Route to get all Spire 4 collectibles
router.route('/').get(getAllSpire4Collectibles);

// Routes to get Spire 4 collectibles
router.route('/orca-space-complex').get(getOrcaSpaceComplex);
router.route('/hypertube').get(getHypertube);
router.route('/space-logistics-complex').get(getSpaceLogisticsComplex);
router.route('/raphael-space-centre').get(getRaphaelSpaceCentre);
router.route('/cargo-lift-121').get(getCargoLift121);
router.route('/maintenance-sector').get(getMaintenanceSector);
router.route('/tower-outer-wall').get(getTowerOuterWall);
router.route('/passenger-lift-161').get(getPassengerLift161);
router.route('/prestige-lounge').get(getPrestigeLounge);
router.route('/vermillion-garden').get(getVermillionGarden);
router.route('/high-orbit-station').get(getHighOrbitStation);
router.route('/nest').get(getNest);

module.exports = router;
