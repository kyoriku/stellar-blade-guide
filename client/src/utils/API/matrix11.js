export const getAllMatrix11Collectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Matrix 11 collectibles:', error);
    throw error;
  }
}

export const getClosedOffPlatform = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/closed-off-platform');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Closed Off Platform collectibles:', error);
    throw error;
  }
}

export const getLandfill = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/landfill');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Landfill collectibles:', error);
    throw error;
  }
}

export const getCollapsedRailBridge = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/collapsed-rail-bridge');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Collapsed Rail Bridge collectibles:', error);
    throw error;
  }
}

export const getUndergroundSewer = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/underground-sewer');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Underground Sewer collectibles:', error);
    throw error;
  }
}

export const getRottenLabyrinth = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/rotten-labyrinth');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Rotten Labyrinth collectibles:', error);
    throw error;
  }
}

export const getTemporaryArmoury = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/temporary-armoury');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Temporary Armoury collectibles:', error);
    throw error;
  }
}

export const getTrainGraveyard = async () => {
  try {
    const response = await fetch('/api/collectibles/matrix-11/train-graveyard');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Train Graveyard collectibles:', error);
    throw error;
  }
}
