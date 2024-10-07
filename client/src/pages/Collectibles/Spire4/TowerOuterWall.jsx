import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const TowerOuterWall = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Robot - Drone Upgrade Module",
      text: "Once you're outside going across the beams, jump across to another beam and follow it to the end. Once you're at the end, climb up the yellow ledges to find a robot that will drop the Drone Upgrade Module.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Once you're back inside the building, drop down and there will be a crate underneath you.",
    },
    {
      id: 3,
      title: "Can - Moonwell",
      text: "From the previous crate, after defeating the Machine Hive, you can jump around the wall to the right and there will be a vending machine at the end with the can inside. If you miss this one, you can fish it up from the Oasis in the Great Desert using Strange Bait after finishing Spire 4",
    },
  ];

  useEffect(() => {
    fetchTowerOuterWallCollectibles();
  }, []);

  const fetchTowerOuterWallCollectibles = async () => {
    const cacheKey = "Spire-4_Tower-Outer-Wall";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Spire-4", "Tower-Outer-Wall");
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
      <Header id="tower-outer-wall" title="▽ Tower Outer Wall Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default TowerOuterWall
