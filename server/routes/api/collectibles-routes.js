const router = require('express').Router();
const { getAllCollectibles } = require('../../controllers/collectibles-controller');
const eidos7Routes = require('./levels/eidos7-routes');
const xionRoutes = require('./levels/xion-routes');
// const wastelandRoutes = require('./levels/wasteland-routes');
// const altessLevoireRoutes = require('./levels/altessLevoire-routes');
// const matrix11Routes = require('./levels/matrix11-routes');
// const greatDesertRoutes = require('./levels/greatDesert-routes');
// const abyssLevoireRoutes = require('./levels/abyssLevoire-routes');
// const eidos9Routes = require('./levels/eidos9-routes');
// const spire4Routes = require('./levels/spire4-routes');

router.route('/').get(getAllCollectibles);

router.use('/eidos-7', eidos7Routes);
router.use('/xion', xionRoutes);
// router.use('/wasteland', wastelandRoutes);
// router.use('/altess-levoire', altessLevoireRoutes);
// router.use('/matrix-11', matrix11Routes);
// router.use('/great-desert', greatDesertRoutes);
// router.use('/abyss-levoire', abyssLevoireRoutes);
// router.use('/eidos-9', eidos9Routes);
// router.use('/spire-4', spire4Routes);

module.exports = router;
