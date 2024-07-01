const { Collectible } = require('../../models');

const wastelandController = {
  async getAllWastelandCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Wasteland' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Wasteland collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getBarrenLands(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Barren Lands' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Barren Lands collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getGreatCanyon(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Great Canyon' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Great Canyon collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getScrapPlains(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Scrap Plains' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Scrap Plains collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOilStorageFacility(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Oil Storage Facility' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Oil Storage Facility collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getScrapYard(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Scrap Yard' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Scrap Yard collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getWastelandBasin(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Wasteland Basin' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Wasteland Basin collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getScrapPlainsContinued(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Scrap Plains (Continued)' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Scrap Plains (Continued) collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPlant(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Plant' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Plant collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getGreatCanyonContinued(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Great Canyon (Continued)' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Great Canyon (Continued) collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getForbiddenArea(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Forbidden Area' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Forbidden Area collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getWastelandContinued(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Wasteland (Continued)' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Wasteland (Continued) collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = wastelandController;