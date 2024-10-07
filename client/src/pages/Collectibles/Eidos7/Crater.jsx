import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import usePersistentCache from "../../../hooks/usePersistentCache";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const Crater = () => {
  const { data: content, loading: isLoading, error } = usePersistentCache(
    "Eidos-7_Crater",
    getCollectiblesByLevelAndLocation,
    "Eidos-7",
    "Crater"
  );

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Legionnaire 274's Memory",
      text: "By a rock as soon as you enter the Crater area (near the small bit of water).",
    },
    {
      id: 2,
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss.",
    }
  ];

  return (
    <section>
      <Header id="crater" title="▽ Crater Collectibles" />
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

export default Crater;
