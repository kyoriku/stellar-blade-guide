const { Collectible } = require('../../models');

const altessLevoireController = {
  async getAllAltessLevoireCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Altess Levoire' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Altess Levoire collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getResearchLabEntrance(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Research Lab Entrance' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Research Lab collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPurificationScanner(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Purification Scanner' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Purification Scanner collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSecurityCenter(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Security Center' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Security Center collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSectorA07(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Sector A07' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Sector A07 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getSpecimenPreservationLab(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Specimen Preservation Lab' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Specimen Preservation Lab collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getTopSecretResearchComplex(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Top Secret Research Complex' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Top Secret Research Complex collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getDeterioratedLobby(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Deteriorated Lobby' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Deteriorated Lobby collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getAirVent(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Air Vent' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Air Vent collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = altessLevoireController;
