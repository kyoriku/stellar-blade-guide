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

  // Eidos 7
  async getAllEidos7Collectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Eidos 7' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Eidos 7 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSilentStreet(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Silent Street' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Silent Street collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getParkingTower(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Parking Tower' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Parking Tower collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAbandonedStation(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Abandoned Station' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Abandoned Station collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getFloodedCommercialSector(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Flooded Commercial Sector' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Flooded Commercial Sector collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getMemoryTower(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Memory Tower' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Memory Tower collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getConstructionZone(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Construction Zone' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Construction Zone collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCityUnderground(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'City Underground' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No City Underground collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCrater(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Crater' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Crater collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getEidos7Continued(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Eidos 7 (Continued)' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Eidos 7 (Continued) collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Xion
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

module.exports = collectiblesController;
