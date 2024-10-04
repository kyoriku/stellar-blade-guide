import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const Hypertube = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Beta Core",
      text: "Straight ahead when you enter the room, if you jump out and to the right, around the wall, you can grab this now.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Head back, and in the northeast corner, near a droid, is a suppl box. Contains Omnibolt and Melee Protection Gear (3 star).",
    },
    {
      id: 3,
      title: "Locked Supply Chest",
      text: "Go down the ladder near to where the Beta Core is, and there's a cache opposite it.",
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 798's Advice",
      text: "Down below, to the left of the second power machine.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "South-southeast from the generator. Behind the fence. In the main downstairs area.",
    },
    {
      id: 6,
      title: "Robot - Tumbler Expansion Module",
      text: "Directly south is a robot, hiding super close by.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "Up the stairs, on the way to the final generator.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "After the brief boss fight and hypertube section, head into the southeast corner and there's a supply box there.",
    },
    {
      id: 9,
      title: "Memorystick - Legionnaire 708's Shout",
      text: "Next to the staircase that leads up to the way out.",
    },
    {
      id: 10,
      title: "Supply Camp - Space Logistics Complex Entrance",
      text: "Next to the door on the way out of the area.",
    },
    {
      id: 11,
      title: "Nano Suit - Orca Engineer",
      text: "Behind the Supply Camp (east side).",
    },
    {
      id: 12,
      title: "Can - Milky Pop",
      text: "Upstairs in the southeast corner of the large warehouse (before leaving through the door out of the area), after the brief boss figh with Belial.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnaire 721's Plea",
      text: "When you finally leave the area, this corpse is in the airlock of sorts.",
    },
  ];


  useEffect(() => {
    fetchHypertubeCollectibles();
  }, []);

  const fetchHypertubeCollectibles = async () => {
    const cacheKey = "Spire-4_Hypertube";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Spire-4", "Hypertube");
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
      <Header id="hypertube" title="▽ Hypertube Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default Hypertube
