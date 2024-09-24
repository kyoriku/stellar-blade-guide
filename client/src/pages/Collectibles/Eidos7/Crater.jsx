import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles"

const Crater = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Legionnaire 274's Memory",
      text: "By a rock as soon as you enter the Crater area (near the small bit of water).",
    },
    {
      id: 2,
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss.",
    }
  ];

  useEffect(() => {
    fetchCraterCollectibles();
  }, []);

  const fetchCraterCollectibles = async () => {
    try {
      const data = await getCollectiblesByLevelAndLocation('Eidos-7', 'Crater');
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
      <Header id="crater" title="▽ Crater Collectibles" />
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

export default Crater;
