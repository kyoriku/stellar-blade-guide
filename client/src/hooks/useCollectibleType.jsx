// src/hooks/useCollectibleType.js
import { useQuery } from "@tanstack/react-query";

// Base URL for the API
const BASE_URL = import.meta.env.VITE_API_COLLECTIBLE_URL;

/**
 * Custom hook to fetch collectibles by type using React Query
 * 
 * @param {string} type - The collectible type
 * @param {object} options - Additional options to pass to useQuery
 * @returns {object} - The query result object with data, loading state, and error
 */
export const useCollectiblesByType = (type, options = {}) => {
  /**
   * Fetches collectibles data for a specific type
   */
  const fetchCollectiblesByType = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${type}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch collectibles of type ${type}:`, error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ["collectibles", "type", type],
    queryFn: fetchCollectiblesByType,
    enabled: !!type,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 2,
    ...options,
  });
};

// Usage example:
// const { data: collectibles, isLoading, error } = useCollectiblesByType("Beta-Core");