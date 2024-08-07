const { Collectible } = require('../../models');

const greatDesertController = {
  async getAllGreatDesertCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Great Desert' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Great Desert collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSolarTower(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Solar Tower' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Solar Tower collectibes found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCollapsedOverpass(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Collapsed Overpass' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Collapsed Overpass collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getBuriedRuins(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Buried Ruins' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Buried Ruins collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCentralGreatDesert(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Central Great Desert' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Central Great Desert collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getNorthernGreatDesert(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Northern Great Desert' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Northern Great Desert collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOasis(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Oasis' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Oasis collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = greatDesertController;
