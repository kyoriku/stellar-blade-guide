import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCapsuleClusterRoom } from '../../../utils/API/abyssLevoire';

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
    try {
      const data = await getCapsuleClusterRoom();
      setContent(data);
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
      />
    </section>
  );
};

export default CapsuleClusterRoom
