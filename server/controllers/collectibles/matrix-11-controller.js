const { Collectible } = require('../../models');

const matrix11Controller = {
  async getAllMatrix11Collectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Matrix 11' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Matrix 11 collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClosedOffPlatform(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Closed Off Platform' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Closed-Off Platform collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getLandfill(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Landfill' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Landfill collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCollapsedRailBridge(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Collapsed Rail Bridge' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Collapsed Rail Bridge collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getUndergroundSewer(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Underground Sewer' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Underground Sewer collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRottenLabyrinth(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Rotten Labyrinth' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Rotten Labyrinth collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getTemporaryArmoury(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Temporary Armoury' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Temporary Armoury collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getTrainGraveyard(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Train Graveyard' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Train Graveyard collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};

module.exports = matrix11Controller;
