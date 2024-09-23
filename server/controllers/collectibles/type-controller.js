const { Collectible } = require('../../models');

const collectibleTypeController = {
  async getBetaCores(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Beta Core' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Beta Core collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getBodyCores(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Body Core' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Body Core collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCamps(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Camp' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Camp collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCans(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Can' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Can collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getDocuments(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Document' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Document collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getDronePacks(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Drone Pack' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Drone Pack collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getEarrings(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Earrings' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Earrings collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getExospines(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Exospine' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Exospines collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getNanoSuits(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Nano Suit' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Nano Suit collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getMemorysticks(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Memorystick' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Memorystick collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPasscodes(req, res) {
    try {
      const collectibles = await Collectible.find({ type: 'Passcode' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Passcode collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = collectibleTypeController;