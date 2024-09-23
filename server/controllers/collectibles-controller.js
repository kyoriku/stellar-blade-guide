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

  async getCollectiblesByType(req, res) {
    try {
      const { type } = req.params;
  
      // Replace hyphens with spaces
      let formattedType = type.replace(/-/g, ' ');
  
      // Capitalize the first letter of each word
      formattedType = formattedType.replace(/\b\w/g, (char) => char.toUpperCase());
  
      // Handle exceptions explicitly
      const exceptions = ["Earrings"];
      if (exceptions.includes(formattedType)) {
        // For exceptions, use the type as is
        formattedType = formattedType;
      } else {
        // For other types, remove trailing 's'
        formattedType = formattedType.replace(/s$/, '');
      }
  
      // Query the database with the normalized type
      const collectibles = await Collectible.find({ type: formattedType });
  
      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: `No collectibles found for type: ${formattedType}` });
      }
  
      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },  
  
  async getCollectiblesByLocation(req, res) {
    console.log('getCollectiblesByLocation called');
    try {
      const { location } = req.params;
      // const formattedLocation = location
      //   .replace(/-/g, ' ')
      //   .replace(/\b\w/g, (char) => char.toUpperCase());
      // const collectibles = await Collectible.find({ location: formattedLocation });
      const collectibles = await Collectible.find({ location });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: `No collectibles found for location: ${formattedLocation}` });
      }

      res.json(collectibles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collectibles for location.' });
    }
  },

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

  async getCollectiblesByLevelAndLocation(req, res) {
    try {
      const { level, location } = req.params;
  
      // Format and trim the level and location parameters
      const formatString = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()).trim();
      const formattedLevel = formatString(level);
      const formattedLocation = location ? formatString(location) : null;
  
      // Construct the query (case-insensitive)
      const query = { level: new RegExp('^' + formattedLevel + '$', 'i') };
  
      if (formattedLocation) {
        query.location = new RegExp('^' + formattedLocation + '$', 'i');
      }
  
      // Query the database
      const collectibles = await Collectible.find(query);
  
      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: `No collectibles found for ${formattedLevel} at ${formattedLocation || 'any location'}` });
      }
  
      res.json(collectibles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = collectiblesController;
