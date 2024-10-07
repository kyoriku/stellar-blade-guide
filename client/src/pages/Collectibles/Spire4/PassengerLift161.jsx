import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const PassengerLift161 = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Once you enter the Passenger Elevator, the camp will be directly to your left.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Straight ahead, behind Arisa.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "After lifting the Code Red and going up to the second floor of the Passenger Elevator, there will be a crate on the right side.",
    },
    {
      id: 4,
      title: "Beta Core",
      text: "After going up the rope leading to the 4th floor, it'll be on a corpse near the bed.",
    },
  ];

  useEffect(() => {
    fetchPassengerLift161Collectibles();
  }, []);

  const fetchPassengerLift161Collectibles = async () => {
    const cacheKey = "Spire-4_Passenger-Lift-161";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Spire-4", "Passenger-Lift-161");
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
      <Header id="passenger-lift-161" title="▽ Passenger Lift 161 Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default PassengerLift161
