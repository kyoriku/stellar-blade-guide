import { useState, useEffect } from 'react';
import { getCollectiblesByLevelAndLocation } from "../utils/API/collectibles";
import { getCachedData, cacheData } from "../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useCachedCollectibles = (level, location) => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollectibles = async () => {
      const cacheKey = `${level}_${location}`;
      try {
        const cachedEntry = await getCachedData(cacheKey);
        const now = Date.now();

        if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
          setContent(cachedEntry.data);
          setIsLoading(false);
          return;
        }

        const data = await getCollectiblesByLevelAndLocation(level, location);
        setContent(data);

        await cacheData(cacheKey, data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch collectibles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectibles();
  }, [level, location]);

  return { content, isLoading, error };
};