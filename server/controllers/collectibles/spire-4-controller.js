const { Collectible } = require('../../models');

const spire4Controller = {
  async getAllSpire4Collectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Spire 4' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Spire 4 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOrcaSpaceComplex(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Orca Space Complex' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Orca Space Complex collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getHypertube(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Hypertube' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Hypertube collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSpaceLogisticsComplex(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Space Logistics Complex' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Space Logistics Complex collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRaphaelSpaceCentre(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Raphael Space Centre' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Raphael Space Centre collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCargoLift121(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Cargo Lift 121' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Cargo Lift 121 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getMaintenanceSector(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Maintenance Sector' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Maintenance Sector collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getTowerOuterWall(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Tower Outer Wall' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Tower Outer Wall collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPassengerLift161(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Passenger Lift 161' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Passenger Lift 161 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPrestigeLounge(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Prestige Lounge' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Prestige Lounge collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getVermillionGarden(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Vermillion Garden' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Vermillion Garden collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getHighOrbitStation(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'High Orbit Station' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No High Orbit Station collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getNest(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Nest' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Nest collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = spire4Controller;
