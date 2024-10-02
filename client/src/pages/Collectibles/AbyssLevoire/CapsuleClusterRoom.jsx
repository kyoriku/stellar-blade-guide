import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const CapsuleClusterRoom = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Once you enter the Capsule Cluster Room, you'll see the crate on one of the platforms to the left. You can jump across the floating platforms to get over to it.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Directly after you leave the Capsule Cluster Room.",
    },
    {
      id: 3,
      title: "Legion Camp",
      text: "After unlocking the next gate from the previous camp, there will be another camp at the top of the stairs.",
    },
  ];

  useEffect(() => {
    fetchCapsuleClusterRoomCollectibles();
  }, []);

  const fetchCapsuleClusterRoomCollectibles = async () => {
    const cacheKey = "Abyss-Levoire_Capsule-Cluster-Room";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Abyss-Levoire", "Capsule-Cluster-Room");
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
      <Header id="capsule-cluster-room" title="▽ Capsule Cluster Room Collectibles" />
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

export default CapsuleClusterRoom
