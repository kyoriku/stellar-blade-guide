const router = require('express').Router();
const {
  getAllAbyssLevoireCollectibles,
  getEmergencyExit,
  getClosedLobby,
  getCapsuleClusterRoom,
  getUndergroundPassage,
  getLaboratoryRuins
} = require('../../../controllers/collectibles/abyss-levoire-controller');

// Route to get all Abyss Levoire collectibles
router.route('/').get(getAllAbyssLevoireCollectibles);

// Routes to get Abyss Levoire collectibles
router.route('/emergency-exit').get(getEmergencyExit);
router.route('/closed-lobby').get(getClosedLobby);
router.route('/capsule-cluster-room').get(getCapsuleClusterRoom);
router.route('/underground-passage').get(getUndergroundPassage);
router.route('/laboratory-ruins').get(getLaboratoryRuins);

module.exports = router;
