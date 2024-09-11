// export const getMemorysticks = async () => {
//   try {
//     const response = await fetch('/api/collectibles/memorysticks');
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to fetch memorysticks:', error);
//     throw error;
//   }
// }

// export const getNanoSuits = async () => {
//   try {
//     const response = await fetch('/api/collectibles/nano-suits');
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error('Failed to fetch nano suits:', error);
//     throw error;
//   }
// }

// const formatUrlToType = (type) => {
//   return type
//     .replace(/-/g, ' ')  // Convert hyphens to spaces
//     .replace(/\b\w/g, (char) => char.toUpperCase())  // Capitalize first letter of each word
//     .replace(/s$/, '');  // Remove trailing 's' if present
// }

export const getCollectiblesByType = async (type) => {
  try {
    const response = await fetch(`/api/collectibles/${type}`);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles of type ${type}:`, error);
    throw error;
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// export const getCollectibles = async (level, location) => {
//   try {
//     const url = location ? `${BASE_URL}/${level}/${location}` : `${BASE_URL}/${level}`;
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error(`Failed to fetch collectibles for ${level}${location ? ` and ${location}` : ''}:`, error);
//     throw error;
//   }
// }

export const getCollectibles = async (options = {}) => {
  const { level, location, type } = options;
  
  try {
    let url = BASE_URL;
    
    if (type) {
      url += `/${type}`;
    }
    if (level) {
      url += `/${level}`;
      if (location) {
        url += `/${location}`;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles:`, error);
    throw error;
  }
}

export const getCollectiblesByLevelAndLocation = async (level, location) => {
  try {
    const response = await fetch(`/api/collectibles/${level}/${location}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles for level ${level} and location ${location}:`, error);
    throw error;
  }
}

export const getEidos7Collectibles = async (location) => {
  try {
    const response = await fetch(`/api/collectibles/eidos-7/${location}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles for location ${location}:`, error);
    throw error;
  }
}
