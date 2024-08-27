import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getPrestigeLounge } from '../../../utils/API/spire4';

const PrestigeLounge = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Earrings - Silver Tooth",
      text: "After reaching the lounge-like area, there will be a crate by the couches.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "Automatically activated during a cutscene after going through the door in the lounge.",
    },
  ];

  useEffect(() => {
    fetchPrestigeLoungeCollectibles();
  }, []);

  const fetchPrestigeLoungeCollectibles = async () => {
    try {
      const data = await getPrestigeLounge();
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
      <Header id="prestige-lounge" title="▽ Prestige Lounge Collectibles" />
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

export default PrestigeLounge
