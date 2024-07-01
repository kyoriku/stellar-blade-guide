export const getAllXionCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/xion');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch all Xion collectibles:', error);
    throw error;
  }
}

export const getXion = async () => {
  try {
    const response = await fetch('/api/collectibles/xion/xion');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Xion collectibles:', error);
    throw error;
  }
}

export const getXionContinued = async () => {
  try {
    const response = await fetch('/api/collectibles/xion/xion-continued');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Xion Continued collectibles:', error);
    throw error;
  }
}