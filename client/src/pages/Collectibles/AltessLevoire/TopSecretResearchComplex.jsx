import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'topSecretResearchComplexData';

const TopSecretResearchComplex = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right.",
    },
  ];

  const { content, isLoading, error } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Altess-Levoire",
    "Top-Secret-Research-Complex"
  );

  return (
    <section>
      <Header id="top-secret-research-complex" title="▽ Top Secret Research Complex Collectibles" />
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

export default TopSecretResearchComplex
