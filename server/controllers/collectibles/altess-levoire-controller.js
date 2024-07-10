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

  async getResearchLab(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Research Lab' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Research Lab collectibles found!' });
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

  async getSpecimenResearchLab(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Specimen Research Lab' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Specimen Research Lab collectibles found!' });
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
};

module.exports = altessLevoireController;
