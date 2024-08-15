import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getEmergencyExit } from '../../../utils/API/abyssLevoire';

const EmergencyExit = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp",
      text: "As you enter through the first door, you'll come across the first supply camp.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "At the end of the saw blade section.",
    },
    {
      id: 3,
      title: "Document - Journal - Kill Mother Sphere",
      text: "Once the saw blades have stopped and the fans are off, there is a document near the yellow cube on the left hand side of the room, opposite the legion camp",
    },
  ];

  useEffect(() => {
    fetchEmergencyExitCollectibles();
  }, []);

  const fetchEmergencyExitCollectibles = async () => {
    try {
      const data = await getEmergencyExit();
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
      <Header id="emergency-exit" title="▽ Emergency Exit Collectibles" />
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

export default EmergencyExit
