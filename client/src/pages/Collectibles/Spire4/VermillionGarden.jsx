import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const VermillionGarden = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Nano Suit - Photogenic",
      text: "After leaving the boss fight arena, this crate is in the next room, straight ahead of you.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "There's a supply box beside the crate with the Nano Suit.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Inside the elevator shaft, take the first moving yellow ledge and jump off to the right to find the crate. Contains 2 Omnibolts and Risk Taking Gear (3 star)",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "After taking the third moving yellow ledge, the next crate will be on the left side.",
    },
  ];

  useEffect(() => {
    fetchVermillionGardenCollectibles();
  }, []);

  const fetchVermillionGardenCollectibles = async () => {
    const cacheKey = "Spire-4_Vermillion-Garden";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Spire-4", "Vermillion-Garden");
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
      <Header id="vermillion-garden" title="▽ Vermillion Garden Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default VermillionGarden
