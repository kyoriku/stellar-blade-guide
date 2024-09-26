import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'securityCenterData';

const SecurityCenter = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - Humanity Liberation Front",
      text: "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right.",
    },
    {
      id: 2,
      title: "Legion Supply Chest",
      text: "By the door you just opened. Can't miss it.",
    }
  ];

  const { content, isLoading, error } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Altess-Levoire",
    "Security-Center"
  );

  return (
    <section>
      <Header id="security-center" title="▽ Security Center Collectibles" />
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

export default SecurityCenter
