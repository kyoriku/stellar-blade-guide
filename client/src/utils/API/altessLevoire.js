export const getAllAltessLevoireCollectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Altess Levoire collectibles:', error);
    throw error;
  }
}

export const getResearchLabEntrance = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/research-lab-entrance');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Research Lab Entrance collectibles:', error);
    throw error;
  }
}

export const getPurificationScanner = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/purification-scanner');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Purification Scanner collectibles:', error);
    throw error;
  }
}

export const getSecurityCenter = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/security-center');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Security Center collectibles:', error);
    throw error;
  }
}

export const getSectorA07 = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/sector-a07');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Sector A07 collectibles:', error);
    throw error;
  }
}

export const getSpecimenPreservationLab = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/specimen-preservation-lab');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Specimen Preservation Lab collectibles:', error);
    throw error;
  }
}

export const getTopSecretResearchComplex = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/top-secret-research-complex');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Top Secret Research Complex collectibles:', error);
    throw error;
  }
}

export const getDeterioratedLobby = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/deteriorated-lobby');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Deteriorated Lobby collectibles:', error);
    throw error;
  }
}

export const getAirVent = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/air-vent');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Air Vent collectibles:', error);
    throw error;
  }
}
