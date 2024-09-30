import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const TemporaryArmoury = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Temporary Armoury Entrance",
      text: "At the bottom of the lift."
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Northwest corner of the boss fight arena (on the shipping crates, inside a shipping crate)."
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "In the eastern corner, behind a shipping crate. Contains 2 Omnibolts and Burst Enhancement Gear."
    },
    {
      id: 4,
      title: "Can - Newfoundland Dry",
      text: "In the southwest corner of the boss fight arena."
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "Next to the aforementioned can."
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "On the way out of the arena (up on the southern walkway)."
    },
    {
      id: 7,
      title: "Legion Camp",
      text: "As you leave the arena in the southeast corner."
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Slide down the lift shaft and there's a crate on a platform at the bottom. It contains an Omnibolt and Shield Destruction Gear (2 star)."
    }
  ];

  useEffect(() => {
    fetchTemporaryArmouryCollectibles();
  }, []);

  const fetchTemporaryArmouryCollectibles = async () => {
    const cacheKey = "Matrix-11_Temporary-Armoury";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Matrix-11", "Temporary-Armoury");
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
      <Header id="temporary-armoury" title="▽ Temporary Armoury Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default TemporaryArmoury;
