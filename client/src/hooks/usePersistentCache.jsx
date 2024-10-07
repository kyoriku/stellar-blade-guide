// import { useEffect, useState, useRef, useCallback } from 'react';

// const MEMORY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
// const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// const usePersistentCache = (cacheKey, fetchFunc, ...args) => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const cache = useRef(new Map());

//   const fetchAndCacheData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const fetchedData = await fetchFunc(...args);
//       const cacheEntry = { data: fetchedData, timestamp: Date.now() };
      
//       // Update in-memory cache
//       cache.current.set(cacheKey, cacheEntry);
      
//       // Update localStorage
//       localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      
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
//       // Check in-memory cache first
//       if (cache.current.has(cacheKey)) {
//         const cachedEntry = cache.current.get(cacheKey);
//         if (Date.now() - cachedEntry.timestamp < MEMORY_CACHE_DURATION) {
//           setData(cachedEntry.data);
//           setLoading(false);
//           return;
//         }
//       }

//       // Check localStorage if not in memory
//       const storedData = localStorage.getItem(cacheKey);
//       if (storedData) {
//         const { data: cachedData, timestamp } = JSON.parse(storedData);
//         if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
//           // Update in-memory cache
//           cache.current.set(cacheKey, { data: cachedData, timestamp });
//           setData(cachedData);
//           setLoading(false);
//           return;
//         }
//       }

//       // If no valid cache found, fetch new data
//       fetchAndCacheData();
//     };

//     getCachedData();
//   }, [cacheKey, fetchAndCacheData]);

//   return { data, loading, error, refetch: fetchAndCacheData };
// };

// export default usePersistentCache;




// // hooks/usePersistentCache.js
// import { useEffect, useState, useRef, useCallback } from 'react';

// const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for localStorage
// const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for in-memory cache

// const usePersistentCache = (cacheKey, fetchFunc, ...args) => {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const cache = useRef(new Map());

//   const fetchAndCacheData = useCallback(async () => {
//     console.log('Fetching fresh data from API');
//     setLoading(true);
//     try {
//       const fetchedData = await fetchFunc(...args);
//       const cacheEntry = { data: fetchedData, timestamp: Date.now() };
      
//       // Update in-memory cache
//       cache.current.set(cacheKey, cacheEntry);
//       console.log('Data cached in memory');
      
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
//       // Check in-memory cache first
//       if (cache.current.has(cacheKey)) {
//         const cachedEntry = cache.current.get(cacheKey);
//         if (Date.now() - cachedEntry.timestamp < MEMORY_CACHE_DURATION) {
//           console.log('Data retrieved from in-memory cache');
//           setData(cachedEntry.data);
//           setLoading(false);
//           return;
//         } else {
//           console.log('In-memory cache expired');
//         }
//       }

//       // Check localStorage if not in memory or memory cache expired
//       const storedData = localStorage.getItem(cacheKey);
//       if (storedData) {
//         const { data: cachedData, timestamp } = JSON.parse(storedData);
//         if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
//           console.log('Data retrieved from localStorage');
//           // Update in-memory cache
//           cache.current.set(cacheKey, { data: cachedData, timestamp: Date.now() });
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




// import { useEffect, useState, useCallback } from 'react';

// // Define the cache outside of the hook to persist across re-renders
// const cache = new Map();

// const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
// const MEMORY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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
      
//       // Update in-memory cache
//       cache.set(cacheKey, cacheEntry);
//       console.log('Data cached in memory');
      
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
//       // Check in-memory cache first
//       if (cache.has(cacheKey)) {
//         const cachedEntry = cache.get(cacheKey);
//         if (Date.now() - cachedEntry.timestamp < MEMORY_CACHE_DURATION) {
//           console.log('Data retrieved from in-memory cache');
//           setData(cachedEntry.data);
//           setLoading(false);
//           return;
//         } else {
//           console.log('In-memory cache expired');
//           cache.delete(cacheKey); // Clean up expired cache
//         }
//       }

//       // Check localStorage if not in memory or memory cache expired
//       const storedData = localStorage.getItem(cacheKey);
//       if (storedData) {
//         const { data: cachedData, timestamp } = JSON.parse(storedData);
//         if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
//           console.log('Data retrieved from localStorage');
//           // Update in-memory cache
//           cache.set(cacheKey, { data: cachedData, timestamp: Date.now() });
//           setData(cachedData);
//           setLoading(false);
//           return;
//         } else {
//           console.log('localStorage cache expired');
//           localStorage.removeItem(cacheKey); // Clean up expired localStorage
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




// import { useEffect, useState, useCallback } from 'react';

// const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for localStorage
// const MEMORY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for in-memory cache
// const MAX_MEMORY_CACHE_SIZE = 5; // Set a limit for in-memory cache size

// // Global cache declared at module level to persist across re-renders
// const memoryCache = new Map();

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

import { useEffect, useState, useCallback } from 'react';

const LOCAL_STORAGE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for localStorage

const usePersistentCache = (cacheKey, fetchFunc, ...args) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndCacheData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchFunc(...args);
      const cacheEntry = { data: fetchedData, timestamp: Date.now() };

      // Update localStorage
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      setData(fetchedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFunc, ...args]);

  useEffect(() => {
    const getCachedData = async () => {
      // Check localStorage
      const storedData = localStorage.getItem(cacheKey);
      if (storedData) {
        const { data: cachedData, timestamp } = JSON.parse(storedData);
        if (Date.now() - timestamp < LOCAL_STORAGE_DURATION) {
          console.log('Data retrieved from localStorage');
          setData(cachedData);
          setLoading(false);
          return;
        } else {
          localStorage.removeItem(cacheKey); // Remove expired cache entry
        }
      }

      // If no valid cache found, fetch new data
      fetchAndCacheData();
    };

    getCachedData();
  }, [cacheKey, fetchAndCacheData]);

  return { data, loading, error, refetch: fetchAndCacheData };
};

export default usePersistentCache;
