import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to prefetch collectibles data for a specific level and location
 * 
 * @returns {Function} Prefetch function that takes level and location parameters
 */
export const usePrefetchCollectibles = () => {
  const queryClient = useQueryClient();
  
  return useCallback((level, location) => {
    // Skip prefetching if the user has data-saving mode enabled
    if (navigator.connection && navigator.connection.saveData) return;
    
    // Skip if no level or location
    if (!level || !location) return;
    
    // Define the query key
    const queryKey = ["collectibles", level, location];
    
    // Skip if the data is already in the cache
    if (queryClient.getQueryData(queryKey)) return;
    
    // Use a timer to debounce the prefetch
    let timer;
    clearTimeout(timer);
    
    timer = setTimeout(() => {
      // The base URL for the API
      const BASE_URL = import.meta.env.VITE_API_COLLECTIBLE_URL || '';
      
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          try {
            const response = await fetch(`${BASE_URL}/${level}/${location}`);
            
            if (!response.ok) {
              console.warn(`Failed to prefetch collectibles for ${level}/${location}: ${response.status}`);
              return null;
            }
            
            return response.json();
          } catch (error) {
            console.warn(`Error prefetching collectibles for ${level}/${location}:`, error);
            return null;
          }
        },
        staleTime: 20 * 60 * 1000, // 20 minutes, matching useCollectibles
        cacheTime: 30 * 60 * 1000, // 30 minutes
      });
    }, 100); // Small delay to avoid unnecessary prefetching
    
    return () => clearTimeout(timer);
  }, [queryClient]);
};

/**
 * Hook specifically for prefetching Eidos 7 collectibles data
 * 
 * @returns {Function} Function to trigger prefetching for Eidos 7
 */
export const usePrefetchEidos7 = () => {
  const prefetchCollectibles = usePrefetchCollectibles();
  
  return useCallback(() => {
    // Prefetch the main sections of Eidos 7
    prefetchCollectibles("Eidos-7", "Silent-Street");
    prefetchCollectibles("Eidos-7", "Parking-Tower");
    // You can add more locations later
  }, [prefetchCollectibles]);
};