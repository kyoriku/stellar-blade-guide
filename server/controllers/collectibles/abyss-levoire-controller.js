const { Collectible } = require('../../models');

const abyssLevoireController = {
  async getAllAbyssLevoireCollectibles(req, res) {
    try {
      const collectibles = await Collectible.find({ level: 'Abyss Levoire' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Abyss Levoire collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getEmergencyExit(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Emergency Exit' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Emergency Exit collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getClosedLobby(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Closed Lobby' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Closed Lobby collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getCapsuleClusterRoom(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Capsule Cluster Room' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Capsule Cluster Room collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getUndergroundPassage(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Underground Passage' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Underground Passage collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getLaboratoryRuins(req, res) {
    try {
      const collectibles = await Collectible.find({ location: 'Laboratory Ruins' });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: 'No Laboratory Ruins collectibles found!' });
      }

      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = abyssLevoireController;
