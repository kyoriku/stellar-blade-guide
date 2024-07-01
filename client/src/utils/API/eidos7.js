export const getAllCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch collectibles:', error);
    throw error;
  }
}

export const getSilentStreet = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/silent-street');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Silent Street collectibles:', error);
    throw error;
  }
}

export const getParkingTower = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/parking-tower');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Parking Tower collectibles:', error);
    throw error;
  }
}

export const getAbandonedStation = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/abandoned-station');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Abandoned Station collectibles:', error);
    throw error;
  }
}

export const getFloodedCommercialSector = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/flooded-commercial-sector');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Flooded Commercial Sector collectibles:', error);
    throw error;
  }
}

export const getMemoryTower = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/memory-tower');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Memory Tower collectibles:', error);
    throw error;
  }
}

export const getConstructionZone = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/construction-zone');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Construction Zone collectibles:', error);
    throw error;
  }
}

export const getCityUnderground = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/city-underground');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch City Underground collectibles:', error);
    throw error;
  }
}

export const getCrater = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/crater');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Crater collectibles:', error);
    throw error;
  }
}

export const getEidos7Continued = async () => {
  try {
    const response = await fetch('/api/collectibles/eidos-7/eidos-7-continued');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Eidos 7 Continued collectibles:', error);
    throw error;
  }
}