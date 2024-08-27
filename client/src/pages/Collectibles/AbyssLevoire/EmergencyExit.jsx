import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
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
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        skeletonVariant="large"
      />
    </section>
  );
};

export default EmergencyExit
