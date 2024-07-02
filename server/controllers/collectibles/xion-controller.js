const { Collectible } = require('../../models');

const xionController = {
  async getAllXionCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Xion' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Xion collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getXion(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Xion' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Xion collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getXionContinued(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Xion (Continued)' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Xion (Continued) collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = xionController;
