export const getAllWastelandCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch all Wasteland collectibles:', error);
    throw error;
  }
}

export const getBarrenLands = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/barren-lands');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Barren Lands collectibles:', error);
    throw error;
  }
}

export const getGreatCanyon = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/great-canyon');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Great Canyon collectibles:', error);
    throw error;
  }
}
export const getScrapPlains = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/scrap-plains');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Scrap Plains collectibles:', error);
    throw error;
  }
}

export const getOilStorageFacility = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/oil-storage-facility');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Oil Storage Facility collectibles:', error);
    throw error;
  }
}

export const getScrapYard = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/scrap-yard');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Scrap Yard collectibles:', error);
    throw error;
  }
}

export const getWastelandBasin = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/wasteland-basin');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Wasteland Basin collectibles:', error);
    throw error;
  }
}

export const getScrapPlainsContinued = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/scrap-plains-continued');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Scrap Plains Continued collectibles:', error);
    throw error;
  }
}

export const getPlant = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/plant');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Plant collectibles:', error);
    throw error;
  }
}

export const getGreatCanyonContinued = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/great-canyon-continued');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
      console.error('Failed to fetch Great Canyon Continued collectibles:', error);
      throw error;
  }
}

export const getForbiddenArea = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/forbidden-area');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
      console.error('Failed to fetch Forbidden Area collectibles:', error);
      throw error;
  }
}

export const getWastelandContinued = async () => {
  try {
    const response = await fetch('/api/collectibles/wasteland/wasteland-continued');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
      console.error('Failed to fetch Wasteland Continued collectibles:', error);
      throw error;
  }
}
