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

  // async getCollectiblesByType(req, res) {
  //   try {
  //     const { type } = req.params;
  //     const collectibles = await Collectible.find({ type });

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for type: ${type}` });
  //     }

  //     res.json(collectibles);
  //   } catch (err) {
  //     res.status(500).json({ message: err.message });
  //   }
  // },

  async getCollectiblesByType(req, res) {
    try {
      const { type } = req.params;
      const formattedType = type.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()).replace(/s$/, '');
      const collectibles = await Collectible.find({ type: formattedType });
  
      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: `No collectibles found for type: ${formattedType}` });
      }
  
      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  

  // async getCollectiblesByLocation(req, res) {
  //   try {
  //     const { location } = req.params;
  //     const formattedLocation = location.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  //     const collectibles = await Collectible.find({ location: formattedLocation });

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for location: ${formattedLocation}` });
  //     }
      
  //     res.json(collectibles);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch collectibles for location.' });
  //   }
  // },

  // async getCollectiblesByLevelAndLocation(req, res) {
  //   try {
  //     const { level, location } = req.params;
  //     const query = { level };
      
  //     if (location) {
  //       query.location = location;
  //     }

  //     const collectibles = await Collectible.find(query);

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for ${level} at ${location || 'any location'}` });
  //     }

  //     res.json(collectibles);
  //   } catch (err) {
  //     res.status(500).json({ message: err.message });
  //   }
  // },
};



module.exports = collectiblesController;
