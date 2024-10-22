import React from "react";
import Header from "./Header";
import ErrorMessage from "./ErrorMessage";
import ContentSection from "./ContentSection";
import usePersistentCache from "../hooks/usePersistentCache";
import { getCollectiblesByLevelAndLocation } from "../utils/API/collectibles";
import { MapPin } from "lucide-react";

const CollectiblesSection = ({
  id,
  title,
  subtitle,
  level,
  location,
  staticContent,
  skeletonVariant,
  alwaysShowFinalHr,
  bottomMarginCondition,
}) => {
  const { data: content, loading: isLoading, error } = usePersistentCache(
    `${level}_${location}`,
    getCollectiblesByLevelAndLocation,
    level,
    location
  );

  return (
    <section>
      <Header id={id} title={title} subtitle={subtitle} icon={<MapPin className='text-secondary' size={32} />} />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        skeletonVariant={skeletonVariant}
        alwaysShowFinalHr={alwaysShowFinalHr}
        bottomMarginCondition={bottomMarginCondition}
      />
    </section>
  );
};

export default CollectiblesSection;
