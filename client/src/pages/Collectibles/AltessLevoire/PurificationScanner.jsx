import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getPurificationScanner } from '../../../utils/API/altessLevoire';
import useCachedFetch from "../../../hooks/useCachedFetch";

const CACHE_KEY = 'purificationScannerData';

const PurificationScanner = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Booting Sequence",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor.",
    },
  ];

  const { content, isLoading, error } = useCachedFetch(CACHE_KEY, getPurificationScanner);

  return (
    <section>
      <Header id="purification-scanner" title="▽ Purification Scanner Collectibles" />
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

export default PurificationScanner;
