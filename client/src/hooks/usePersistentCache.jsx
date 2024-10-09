// import { useEffect, useState, useCallback } from 'react';

// const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for localStorage
// const MEMORY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for in-memory cache
// const MAX_MEMORY_CACHE_SIZE = 12; // Set a limit for in-memory cache size

// // Global cache declared at module level to persist across re-renders
// const memoryCache = new Map();
// window.memoryCache = memoryCache; // Expose memory cache globally for debugging

// const usePersistentCache = (cacheKey, fetchFunc, ...args) => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchAndCacheData = useCallback(async () => {
//     console.log('Fetching fresh data from API');
//     setLoading(true);
//     try {
//       const fetchedData = await fetchFunc(...args);
//       const cacheEntry = { data: fetchedData, timestamp: Date.now() };

//       // Update in-memory cache (LRU logic)
//       if (memoryCache.has(cacheKey)) {
//         memoryCache.delete(cacheKey);  // Remove the existing entry to update its order
//       }
//       memoryCache.set(cacheKey, cacheEntry);
//       console.log('Data cached in memory with LRU');

//       // Evict least recently used if cache exceeds size limit
//       if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
//         const oldestKey = memoryCache.keys().next().value; // Get the first (oldest) key
//         memoryCache.delete(oldestKey);
//         console.log(`Evicted ${oldestKey} from memory cache (LRU)`);
//       }

//       // Update localStorage
//       localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
//       console.log('Data cached in localStorage');

//       setData(fetchedData);
//       setError(null);
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError('Failed to fetch data. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   }, [cacheKey, fetchFunc, ...args]);

//   useEffect(() => {
//     const getCachedData = async () => {
//       // Check in-memory cache first (LRU logic)
//       if (memoryCache.has(cacheKey)) {
//         const cachedEntry = memoryCache.get(cacheKey);
//         if (Date.now() - cachedEntry.timestamp < MEMORY_CACHE_DURATION) {
//           console.log('Data retrieved from in-memory cache (LRU)');
//           setData(cachedEntry.data);
//           setLoading(false);

//           // Move the accessed item to the end to mark it as most recently used
//           memoryCache.delete(cacheKey);
//           memoryCache.set(cacheKey, cachedEntry);

//           return;
//         } else {
//           console.log('In-memory cache expired');
//           memoryCache.delete(cacheKey);  // Remove expired cache entry
//         }
//       }

//       // Check localStorage if not in memory or memory cache expired
//       const storedData = localStorage.getItem(cacheKey);
//       if (storedData) {
//         const { data: cachedData, timestamp } = JSON.parse(storedData);
//         if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
//           console.log('Data retrieved from localStorage');
//           // Update in-memory cache and apply LRU policy
//           memoryCache.set(cacheKey, { data: cachedData, timestamp: Date.now() });

//           // Evict if over memory cache size
//           if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
//             const oldestKey = memoryCache.keys().next().value;
//             memoryCache.delete(oldestKey);
//             console.log(`Evicted ${oldestKey} from memory cache (LRU)`);
//           }

//           setData(cachedData);
//           setLoading(false);
//           return;
//         } else {
//           console.log('localStorage cache expired');
//         }
//       }

//       // If no valid cache found, fetch new data
//       console.log('No valid cache found, fetching fresh data');
//       fetchAndCacheData();
//     };

//     getCachedData();
//   }, [cacheKey, fetchAndCacheData]);

//   return { data, loading, error, refetch: fetchAndCacheData };
// };

// export default usePersistentCache;

/////////////////////////////////////////

import { useEffect, useState, useCallback, useRef } from 'react';

// Define the duration for which the cached data is considered valid (24 hours)
const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to retrieve and validate cached data from localStorage
const getCachedData = (cacheKey) => {
  const storedData = localStorage.getItem(cacheKey);
  if (storedData) {
    const { data: cachedData, timestamp } = JSON.parse(storedData);
    // Check if the cached data is still valid
    if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
      return cachedData;
    }
    // Remove expired cache entry
    localStorage.removeItem(cacheKey);
  }
  return null;
};

// Function to store data in localStorage with a timestamp
const setCachedData = (cacheKey, data) => {
  const cacheEntry = { data, timestamp: Date.now() };
  localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
};

// Custom hook for persistent caching
const usePersistentCache = (cacheKey, fetchFunc, ...args) => {
  // State to hold data, loading status, and error
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });

  // Ref to store args to prevent unnecessary re-renders
  const argsRef = useRef(args);

  // Function to fetch and cache data
  const fetchAndCacheData = useCallback(async () => {
    // Set loading to true and clear any previous errors
    setState(prevState => ({ ...prevState, loading: true, error: null }));
    try {
      // Fetch new data
      const fetchedData = await fetchFunc(...argsRef.current);
      // Cache the fetched data
      setCachedData(cacheKey, fetchedData);
      // Update state with new data
      setState({ data: fetchedData, loading: false, error: null });
    } catch (err) {
      // Handle error
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Failed to fetch data. Please try again later.',
      }));
    }
  }, [cacheKey, fetchFunc]);

  // Function to initialize cache or fetch new data
  const initializeCache = useCallback(() => {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      // Use cached data if available
      setState({ data: cachedData, loading: false, error: null });
    } else {
      // Fetch new data if cache is empty or expired
      fetchAndCacheData();
    }
  }, [cacheKey, fetchAndCacheData]);

  // Effect to initialize cache on mount or when dependencies change
  useEffect(() => {
    initializeCache();
  }, [initializeCache]);

  // Function to manually refetch data
  const refetch = useCallback(() => {
    fetchAndCacheData();
  }, [fetchAndCacheData]);

  // Return current state and refetch function
  return { ...state, refetch };
};

export default usePersistentCache;