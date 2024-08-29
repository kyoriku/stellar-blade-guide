export const getMemorysticks = async () => {
  try {
    const response = await fetch('/api/collectibles/memorysticks');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch memorysticks:', error);
    throw error;
  }
}

export const getNanoSuits = async () => {
  try {
    const response = await fetch('/api/collectibles/nano-suits');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch nano suits:', error);
    throw error;
  }
}

// const formatUrlToType = (type) => {
//   return type
//     .replace(/-/g, ' ')  // Convert hyphens to spaces
//     .replace(/\b\w/g, (char) => char.toUpperCase())  // Capitalize first letter of each word
//     .replace(/s$/, '');  // Remove trailing 's' if present
// }

export const getCollectiblesByType = async (type) => {
  try {
    // const formattedType = type.replace(/\s+/g, '-').toLowerCase();
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

// export const getCollectiblesByLevelAndLocation = async (level, location) => {
//   try {
//     const formattedLevel = level.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
//     const formattedLocation = location.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    
//     const response = await fetch(`/api/collectibles/${formattedLevel}/${formattedLocation}`);
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error(`Failed to fetch collectibles for level ${level} and location ${location}:`, error);
//     throw error;
//   }
// }

// export const getCollectiblesByLocation = async (location) => {
//   try {
//     const formattedLocation = location.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
//     const response = await fetch(`/api/collectibles/${formattedLocation}`);
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status} ${response.statusText}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error(`Failed to fetch collectibles for location ${location}:`, error);
//     throw error;
//   }
// }
