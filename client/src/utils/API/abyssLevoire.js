export const getAllAbyssLevoireCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Abyss Levoire collectibles:', error);
    throw error;
  }
}

export const getEmergencyExit = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire/emergency-exit');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Emergency Exit collectibles:', error);
    throw error;
  }
}

export const getClosedLobby = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire/closed-lobby');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Closed Lobby collectibles:', error);
    throw error;
  }
}

export const getCapsuleClusterRoom = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire/capsule-cluster-room');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Capsule Cluster Room collectibles:', error);
    throw error;
  }
}

export const getUndergroundPassage = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire/underground-passage');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Underground Passage collectibles:', error);
    throw error;
  }
}

export const getLaboratoryRuins = async () => {
  try {
    const response = await fetch('/api/collectibles/abyss-levoire/laboratory-ruins');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Laboratory Ruins collectibles:', error);
    throw error;
  }
}
