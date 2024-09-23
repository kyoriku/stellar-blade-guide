const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getBetaCores = async () => {
  try {
    const response = await fetch(`${BASE_URL}/beta-cores`);
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error('Failed to fetch Beta Core collectibles');
  }
}
