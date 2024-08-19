import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
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
      {!error && (
        <div>
          {staticContent.map((item, index) => (
            <article key={item.id}>
              <ContentText title={item.title} text={item.text} />
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
              )}
              <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CapsuleClusterRoom
