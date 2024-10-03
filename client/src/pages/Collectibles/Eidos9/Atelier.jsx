import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const Atelier = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "After going down the red slide and reaching the floating cargo containers, right before jumping onto the main island, you can jump to the half-submerged cargo container. You'll land in the water and have to swim a little bit to the cargo container, but you shouldn't die depending on how far you managed to jump. From here, jump towards the smaller island, where there will be a crate behind the rubble.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Once you reach the Atelier, the camp will be on the pathway around to the entrance.",
    },
    {
      id: 3,
      title: "Document - Messages - What Will You Choose",
      text: "On the ground inside the Atelier.",
    },
  ];


  useEffect(() => {
    fetchAtelierCollectibles();
  }, []);

  const fetchAtelierCollectibles = async () => {
    const cacheKey = "Eidos-9_Atelier";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Eidos-9", "Atelier");
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
      <Header id="atelier" title="▽ Atelier Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        alwaysShowFinalHr={true}
      />
    </section>
  );
};

export default Atelier
