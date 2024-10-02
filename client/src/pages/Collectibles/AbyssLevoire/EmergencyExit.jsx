import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const EmergencyExit = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp",
      text: "As you enter through the first door, you'll come across the first supply camp.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "At the end of the saw blade section.",
    },
    {
      id: 3,
      title: "Document - Journal - Kill Mother Sphere",
      text: "Once the saw blades have stopped and the fans are off, there is a document near the yellow cube on the left hand side of the room, opposite the legion camp",
    },
  ];

  useEffect(() => {
    fetchEmergencyExitCollectibles();
  }, []);

  const fetchEmergencyExitCollectibles = async () => {
    const cacheKey = "Abyss-Levoire_Emergency-Exit";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Abyss-Levoire", "Emergency-Exit");
      setContent(data);

      await cacheData(cacheKey, data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header id="emergency-exit" title="▽ Emergency Exit Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        skeletonVariant="large"
      />
    </section>
  );
};

export default EmergencyExit
