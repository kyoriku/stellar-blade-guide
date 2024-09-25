import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getSectorA07 } from '../../../utils/API/altessLevoire';
import useCachedFetch from "../../../hooks/useCachedFetch";

const CACHE_KEY = 'sectorA07Data';

const SectorA07 = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Security Procedure Guide",
      text: "After the symbol floor puzzle, on the right before you go through the next door.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Through the door, on your left",
    }
  ];

  const { content, isLoading, error } = useCachedFetch(CACHE_KEY, getSectorA07);

  return (
    <section>
      <Header id="sector-a07" title="▽ Sector A07 Collectibles" />
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

export default SectorA07
