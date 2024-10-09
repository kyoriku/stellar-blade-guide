import React from "react";
import Header from "./Header";
import ErrorMessage from "./ErrorMessage";
import ContentSection from "./ContentSection";
import usePersistentCache from "../hooks/usePersistentCache";
import { getCollectiblesByLevelAndLocation } from "../utils/API/collectibles";

const CollectiblesSection = ({ id, title, level, location, staticContent, skeletonVariant }) => {
  const { data: content, loading: isLoading, error } = usePersistentCache(
    `${level}_${location}`,
    getCollectiblesByLevelAndLocation,
    level,
    location
  );

  return (
    <section>
      <Header id={id} title={`▽ ${title} Collectibles`} />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        skeletonVariant={skeletonVariant}
      />
    </section>
  );
};

export default CollectiblesSection;