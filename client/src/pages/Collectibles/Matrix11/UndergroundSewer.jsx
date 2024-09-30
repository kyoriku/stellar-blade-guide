import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const UndergroundSewer = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Jamie's Plea",
      text: "After EVE says “This area…”, head down, and there are a load of dead bodies down there. In the northeast corner there are two together. One will have this memorystick on it.",
    },
    {
      id: 2,
      title: "Passcode - εκακδζ",
      text: "The other body (mentioned above) will have this passcode on it.",
    },
    {
      id: 3,
      title: "Nano Suit - Daily Mascot",
      text: "If you head back up and head south-southwest a Skull will crash through the wall. Defeat the enemies and go into the room where the Skull crashed through from.",
    },
    {
      id: 4,
      title: "Locked Supply Chest",
      text: "At the end of the corridor (south) where the previously mentioned Skull came from. Needs the EKaKds passcode. Contains the Fusion Cell.",
    },
    {
      id: 5,
      title: "Memorystick - Paul's Memory",
      text: "Behind the aforementioned chest.",
    },
    {
      id: 6,
      title: "Memorystick - Norman's Advice",
      text: "After going up the lift and crossing the walkway, this body is straight ahead, next to the floodgate.",
    },
    {
      id: 7,
      title: "Exospine - Burst Trance-Type",
      text: "Head north and then west into a small room. The chest with this item is inside.",
    },
    {
      id: 8,
      title: "Robot - Document - Log - To the Little Drone",
      text: "Head southwest and into the floodgate control room. Firstly, however, head upstairs and there is a robot above it.",
    },
    {
      id: 9,
      title: "Locked Supply Chest",
      text: "After opening the floodgates, head towards the objective, but instead of going the correct way, swim down to the south. There's a hole in the roof in that passage where you found the Fusion Cell.",
    },
    {
      id: 10,
      title: "Beta Core",
      text: "Again, before heading the correct way, while in the central chamber, dive down and head into the northeast corner. When you're in the corner, swim to the surface and there you'll find a Beta Core.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "In the right corner of the corridor, after you open the main quest objective door.",
    },
    {
      id: 12,
      title: "Legion Camp",
      text: "Down the bottom of the stairs."
    }
  ];

  useEffect(() => {
    fetchUndergroundSewerCollectibles();
  }, []);

  const fetchUndergroundSewerCollectibles = async () => {
    const cacheKey = "Matrix-11_Underground-Sewer";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Matrix-11", "Underground-Sewer");
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
      <Header id="underground-sewer" title="▽ Underground Sewer Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default UndergroundSewer;
