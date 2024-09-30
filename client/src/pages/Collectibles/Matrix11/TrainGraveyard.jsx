import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const TrainGraveyard = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Robot - Tumbler Expansion Module",
      text: "In the Train Graveyard, on the south side of the long flooded tunnel, inside a locked container (the right of the two)."
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Swim through the shipping containers to the north of that carriage above and this is on top of a shipping container."
    },
    {
      id: 3,
      title: "Passcode - μηλδκα",
      text: "About midway down, underneath 2 Skull monsters, inside a train carriage underwater, there's a corpse with a passcode."
    },
    {
      id: 4,
      title: "Body Core",
      text: "To the northwest of the previous carriage is a platform above the water. There is a body with a Body Core on top. Use the wooden planks to jump over to it."
    },
    {
      id: 5,
      title: "Can - Corsair Ale",
      text: "If you follow the passage to the north, you can swim under (near the middle to the left). There you'll find this can on the eastern side."
    },
    {
      id: 6,
      title: "Legion Camp",
      text: "After leaving the flooded tunnel, there's a Legion Camp as you exit."
    },
    {
      id: 7,
      title: "Memorystick - Legionnaire 516's Memory",
      text: "Underneath the Legion Camp, in a dead end."
    },
    {
      id: 8,
      title: "Robot - Drone Upgrade Modules",
      text: "After sliding down the shaft full of turbines, do a 180 and head to the east. There's a robot there."
    },
    {
      id: 9,
      title: "Memorystick - Legionnaire 511's Prayer",
      text: "Near the Hive at the top of the staircase, after passing through the tunnel after the sliding set-piece."
    },
    {
      id: 10,
      title: "Supply Camp - Contaminated Water Purification Plant Entrance",
      text: "At the top of said stairs, behind the Hive."
    },
    {
      id: 11,
      title: "Body Core",
      text: "Above the Supply Camp, and beneath the door to the boss fight."
    }
  ];

  useEffect(() => {
    fetchTrainGraveyardCollectibles();
  }, []);

  const fetchTrainGraveyardCollectibles = async () => {
    const cacheKey = "Matrix-11_Train-Graveyard";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Matrix-11", "Train-Graveyard");
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
      <Header id="train-graveyard" title="▽ Train Graveyard Collectibles" />
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

export default TrainGraveyard;
