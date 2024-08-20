export const getAllSpire4Collectibles = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Spire 4 collectibles:', error);
    throw error;
  }
}

export const getOrcaSpaceComplex = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/orca-space-complex');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Orca Space Complex collectibles:', error);
    throw error;
  }
}

export const getHypertube = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/hypertube');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Hypertube collectibles:', error);
    throw error;
  }
}

export const getSpaceLogisticsComplex = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/space-logistics-complex');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Space Logistics Complex collectibles:', error);
    throw error;
  }
}

export const getRaphaelSpaceCentre = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/raphael-space-centre');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Raphael Space Centre collectibles:', error);
    throw error;
  }
}

export const getCargoLift121 = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/cargo-lift-121');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Cargo Lift 121 collectibles:', error);
    throw error;
  }
}

export const getMaintenanceSector = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/maintenance-sector');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Maintenance Sector collectibles:', error);
    throw error;
  }
}

export const getTowerOuterWall = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/tower-outer-wall');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Tower Outer Wall collectibles:', error);
    throw error;
  }
}

export const getPassengerLift161 = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/passenger-lift-161');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Passenger Lift 161 collectibles:', error);
    throw error;
  }
}

export const getPrestigeLounge = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/prestige-lounge');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Prestige Lounge collectibles:', error);
    throw error;
  }
}

export const getVermillionGarden = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/vermillion-garden');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Vermillion Garden collectibles:', error);
    throw error;
  }
}

export const getHighOrbitStation = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/high-orbit-station');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch High Orbit Station collectibles:', error);
    throw error;
  }
}

export const getNest = async () => {
  try {
    const response = await fetch('/api/collectibles/spire-4/nest');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Nest collectibles:', error);
    throw error;
  }
}
