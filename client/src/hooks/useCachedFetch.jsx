// import { useEffect, useState } from "react";

// const useCachedFetch = (cacheKey, fetchDataFunc, cacheExpiration = 24 * 60 * 60 * 1000) => {
//   const [content, setContent] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       // Check session storage for cached data
//       const cachedData = sessionStorage.getItem(cacheKey);
//       if (cachedData) {
//         const { data, timestamp } = JSON.parse(cachedData);
//         const isCacheExpired = (Date.now() - timestamp) > cacheExpiration;

//         if (!isCacheExpired) {
//           setContent(data);
//           setIsLoading(false);
//           return; // Use cached data and skip the fetch
//         }
//       }

//       // If no cached data or expired, fetch new data
//       try {
//         const data = await fetchDataFunc();
//         setContent(data);

//         // Update session storage with new data
//         const cacheData = { data, timestamp: Date.now() };
//         sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
//       } catch (err) {
//         console.error(err);
//         setError("Failed to fetch data. Please try again later.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, [cacheKey, fetchDataFunc, cacheExpiration]);

//   return { content, isLoading, error };
// };

// export default useCachedFetch;

// import { useEffect, useState } from "react";

// const useCachedFetch = (cacheKey, fetchDataFunc, cacheExpiration = 24 * 60 * 60 * 1000, ...args) => {
//   const [content, setContent] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       // Check session storage for cached data
//       const cachedData = sessionStorage.getItem(cacheKey);
//       if (cachedData) {
//         const { data, timestamp } = JSON.parse(cachedData);
//         const isCacheExpired = (Date.now() - timestamp) > cacheExpiration;

//         if (!isCacheExpired) {
//           setContent(data);
//           setIsLoading(false);
//           return; // Use cached data and skip the fetch
//         }
//       }

//       // If no cached data or expired, fetch new data
//       try {
//         const data = await fetchDataFunc(...args); // Spread the arguments here
//         setContent(data);

//         // Update session storage with new data
//         const cacheData = { data, timestamp: Date.now() };
//         sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
//       } catch (err) {
//         console.error(err);
//         setError("Failed to fetch data. Please try again later.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, [cacheKey, fetchDataFunc, cacheExpiration, ...args]); // Add args to the dependency array

//   return { content, isLoading, error };
// };

// export default useCachedFetch;

import { useEffect, useState } from "react";

const useCachedFetch = (cacheKey, fetchDataFunc, ...args) => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the default cache expiration time
  const cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  useEffect(() => {
    const fetchData = async () => {
      // Check session storage for cached data
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isCacheExpired = (Date.now() - timestamp) > cacheExpiration;

        if (!isCacheExpired) {
          setContent(data);
          setIsLoading(false);
          return; // Use cached data and skip the fetch
        }
      }

      // If no cached data or expired, fetch new data
      try {
        const data = await fetchDataFunc(...args); // Spread the arguments here
        setContent(data);

        // Update session storage with new data
        const cacheData = { data, timestamp: Date.now() };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cacheKey, fetchDataFunc, ...args]); // Add args to the dependency array

  return { content, isLoading, error };
};

export default useCachedFetch;


// import { useEffect, useState } from "react";

// const useCachedFetch = ({
//   cacheKey,
//   fetchDataFunc,
//   cacheExpiration = 24 * 60 * 60 * 1000,
//   args = [], // Default to an empty array if not provided
// }) => {
//   const [content, setContent] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       // Check session storage for cached data
//       const cachedData = sessionStorage.getItem(cacheKey);
//       if (cachedData) {
//         const { data, timestamp } = JSON.parse(cachedData);
//         const isCacheExpired = Date.now() - timestamp > cacheExpiration;

//         if (!isCacheExpired) {
//           setContent(data);
//           setIsLoading(false);
//           return; // Use cached data and skip the fetch
//         }
//       }

//       // If no cached data or expired, fetch new data
//       try {
//         const data = await fetchDataFunc(...args); // Spread the arguments here
//         setContent(data);

//         // Update session storage with new data
//         const cacheData = { data, timestamp: Date.now() };
//         sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
//       } catch (err) {
//         console.error(err);
//         setError("Failed to fetch data. Please try again later.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, [cacheKey, fetchDataFunc, cacheExpiration, ...args]); // Add args to the dependency array

//   return { content, isLoading, error };
// };

// export default useCachedFetch;
