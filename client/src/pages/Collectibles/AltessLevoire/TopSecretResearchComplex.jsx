import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getTopSecretResearchComplex } from '../../../utils/API/altessLevoire';
import useCachedFetch from "../../../hooks/useCachedFetch";

const CACHE_KEY = 'topSecretResearchComplexData';

const TopSecretResearchComplex = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right.",
    },
  ];

  const { content, isLoading, error } = useCachedFetch(CACHE_KEY, getTopSecretResearchComplex);

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
