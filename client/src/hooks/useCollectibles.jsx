// src/hooks/useCollectibles.js
import { useQuery } from "@tanstack/react-query";

// Base URL for the API
const BASE_URL = import.meta.env.VITE_API_COLLECTIBLE_URL;

/**
 * Custom hook to fetch collectibles using React Query
 * 
 * @param {string} level - The level name (e.g., "Eidos-7")
 * @param {string} location - The location within the level (e.g., "Silent-Street")
 * @param {object} options - Additional options to pass to useQuery
 * @returns {object} - The query result object with data, loading state, and error
 */
export const useCollectibles = (level, location, options = {}) => {
  /**
   * Fetches collectibles data for a specific level and location
   */
  const fetchCollectibles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${level}/${location}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch collectibles for level ${level} and location ${location}:`, error);
      throw error;
    }
  };

  // Use React Query's useQuery hook with our fetch function
  return useQuery({
    queryKey: ["collectibles", level, location],
    queryFn: fetchCollectibles,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: !!level && !!location, // Only run if both level and location exist
    retry: 2,
    ...options,
  });
};

// Usage example:
// const { data: collectibles, isLoading, error } = useCollectibles("Eidos-7", "Silent-Street");