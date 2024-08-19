const { Collectible } = require('../../models');

const eidos9Controller = {
  async getAllEidos9Collectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Eidos 9' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Eidos 9 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFallenOverpass(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Fallen Overpass' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Fallen Overpass collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSubmergedCity(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Submerged City' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Submerged City collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAtelier(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Atelier' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Atelier collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = eidos9Controller;
