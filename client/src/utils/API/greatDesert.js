export const getAllGreatDesertCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Great Desert collectibles:', error);
    throw error;
  }
}

export const getSolarTower = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/solar-tower');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Solar Tower collectibles:', error);
    throw error;
  }
}

export const getCollapsedOverpass = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/collapsed-overpass');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Collapsed Overpass collectibles:', error);
    throw error;
  }
}

export const getBuriedRuins = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/buried-ruins');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Buried Ruins collectibles:', error);
    throw error;
  }
}

export const getCentralGreatDesert = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/central-great-desert');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Central Great Desert collectibles:', error);
    throw error;
  }
}

export const getNorthernGreatDesert = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/northern-great-desert');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Northern Great Desert collectibles:', error);
    throw error;
  }
}

export const getOasis = async () => {
  try {
    const response = await fetch('/api/collectibles/great-desert/oasis');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Oasis collectibles:', error);
    throw error;
  }
}
