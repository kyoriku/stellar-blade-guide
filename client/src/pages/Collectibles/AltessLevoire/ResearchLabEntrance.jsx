import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getResearchLabEntrance } from "../../../utils/API/altessLevoire";
import useCachedFetch from "../../../hooks/useCachedFetch";

const CACHE_KEY = 'researchLabEntranceData';

const ResearchLabEntrance = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - You Are Fake",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one.",
    },
  ];

  const { content: cachedImages, isLoading, error } = useCachedFetch(CACHE_KEY, getResearchLabEntrance);

  return (
    <section>
      <Header id="research-lab-entrance" title="▽ Research Lab Entrance Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={cachedImages}
        isLoading={isLoading}
        skeletonVariant="large"
      />
    </section>
  );
};

export default ResearchLabEntrance;
