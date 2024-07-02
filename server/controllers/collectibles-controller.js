const { Collectible } = require('../models');

const collectiblesController = {
  async getAllCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find();

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = collectiblesController;
