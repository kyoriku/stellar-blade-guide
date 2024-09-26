import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'researchLabEntranceData';

const ResearchLabEntrance = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - You Are Fake",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one.",
    },
  ];

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Altess-Levoire",
    "Research-Lab-Entrance"
  );

  return (
    <section>
      <Header id="research-lab-entrance" title="▽ Research Lab Entrance Collectibles" />
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

export default ResearchLabEntrance;
