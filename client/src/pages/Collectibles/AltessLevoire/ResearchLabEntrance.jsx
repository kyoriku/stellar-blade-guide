import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getResearchLabEntrance } from '../../../utils/API/altessLevoire';

const ResearchLabEntrance = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - You Are Fake",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one.",
    },
  ];

  useEffect(() => {
    fetchResearchLabEntranceCollectibles();
  }, []);

  const fetchResearchLabEntranceCollectibles = async () => {
    try {
      const data = await getResearchLabEntrance();
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
      <Header id="research-lab-entrance" title="▽ Research Lab Entrance Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ResearchLabEntrance
