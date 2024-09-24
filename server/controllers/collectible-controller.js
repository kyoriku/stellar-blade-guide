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

  async getCollectiblesByLevelAndLocation(req, res) {
    try {
      const { level, location } = req.params;
      const formattedLevel = level
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const formattedLocation = location
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      const collectibles = await Collectible.find({ level: formattedLevel, location: formattedLocation });

      if (!collectibles || collectibles.length === 0) {
        return res.status(404).json({ message: `No collectibles found for level: ${level} and location: ${formattedLocation}` });
      }

      res.json(collectibles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch collectibles for level and location.' });
    }
  },

  async getCollectiblesByLevelOrType(req, res) {
    try {
      const { param } = req.params;

      // Format the parameter (common for both type and level)
      let formattedParam = param
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      // Special handling for type
      const exceptions = ["Earrings"];
      if (!exceptions.includes(formattedParam) && !formattedParam.endsWith('s')) {
        // If it's not an exception and doesn't end with 's', it's likely a level
        // Try to find collectibles by level
        const levelCollectibles = await Collectible.find({ level: formattedParam });
        if (levelCollectibles.length > 0) {
          return res.json(levelCollectibles);
        }
      }

      // If not found by level or if it ends with 's', treat it as a type
      if (!exceptions.includes(formattedParam)) {
        // For non-exception types, remove trailing 's'
        formattedParam = formattedParam.replace(/s$/, '');
      }

      // Try to find collectibles by type
      const typeCollectibles = await Collectible.find({ type: formattedParam });

      if (typeCollectibles.length > 0) {
        return res.json(typeCollectibles);
      }

      // If still not found, return 404
      return res.status(404).json({ message: `No collectibles found for ${param}` });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // async getCollectiblesByLevel(req, res) {
  //   try {
  //     const { level } = req.params;
  //     const formattedLevel = level
  //       .replace(/-/g, ' ')
  //       .replace(/\b\w/g, (char) => char.toUpperCase());
  //     const collectibles = await Collectible.find({ level: formattedLevel });

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for level: ${level}` });
  //     }

  //     res.json(collectibles);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch collectibles for level.' });
  //   }
  // },

  // async getCollectiblesByLocation(req, res) {
  //   try {
  //     const { location } = req.params;
  //     const formattedLocation = location
  //       .replace(/-/g, ' ')
  //       .replace(/\b\w/g, (char) => char.toUpperCase());
  //     const collectibles = await Collectible.find({ location: formattedLocation });

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for location: ${formattedLocation}` });
  //     }

  //     res.json(collectibles);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch collectibles for location.' });
  //   }
  // },

  // async getCollectiblesByType(req, res) {
  //   try {
  //     const { type } = req.params;

  //     // Replace hyphens with spaces
  //     let formattedType = type.replace(/-/g, ' ');

  //     // Capitalize the first letter of each word
  //     formattedType = formattedType.replace(/\b\w/g, (char) => char.toUpperCase());

  //     // Handle exceptions explicitly
  //     const exceptions = ["Earrings"];
  //     if (exceptions.includes(formattedType)) {
  //       // For exceptions, use the type as is
  //       formattedType = formattedType;
  //     } else {
  //       // For other types, remove trailing 's'
  //       formattedType = formattedType.replace(/s$/, '');
  //     }

  //     // Query the database with the normalized type
  //     const collectibles = await Collectible.find({ type: formattedType });

  //     if (!collectibles || collectibles.length === 0) {
  //       return res.status(404).json({ message: `No collectibles found for type: ${formattedType}` });
  //     }

  //     res.json(collectibles);
  //   } catch (err) {
  //     res.status(500).json({ message: err.message });
  //   }
  // },
};

module.exports = collectiblesController;
