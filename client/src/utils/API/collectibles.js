const BASE_URL = import.meta.env.VITE_API_COLLECTIBLE_URL;

export const getCollectiblesByLevelAndLocation = async (level, location) => {
  try {
    const response = await fetch(`${BASE_URL}/${level}/${location}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles for level ${level} and location ${location}:`, error);
    throw error;
  }
}

export const getCollectiblesByType = async (type) => {
  try {
    const response = await fetch(`${BASE_URL}/${type}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles of type ${type}:`, error);
    throw error;
  }
}

export const getCollectiblesByLevelOrType = async (param) => {
  try {
    const response = await fetch(`${BASE_URL}/${param}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch collectibles by level or type ${param}:`, error);
    throw error;
  }
}
