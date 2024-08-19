export const getAllEidos9Collectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-9');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Eidos 9 collectibles:', error);
    throw error;
  }
}

export const getFallenOverpass = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-9/fallen-overpass');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Fallen Overpass collectibles:', error);
    throw error;
  }
}

export const getSubmergedCity = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-9/submerged-city');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Submerged City collectibles:', error);
    throw error;
  }
}

export const getAtelier = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-9/atelier');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Atelier collectibles:', error);
    throw error;
  }
}