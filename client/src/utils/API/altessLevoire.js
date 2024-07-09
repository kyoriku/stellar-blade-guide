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

export const getResearchLab = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/research-lab');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Research Lab collectibles:', error);
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

export const getSpecimenResearchLab = async () => {
  try {
    const response = await fetch('/api/collectibles/altess-levoire/specimen-research-lab');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Specimen Research Lab collectibles:', error);
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
