import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'plantData';

const Plant = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Luke's Memory",
      text: "At the bottom of the water in the middle of the Plant.",
    },
    {
      id: 2,
      title: "Memorystick - Go's Memory",
      text: "Once you pick up the “Incarceration” side quest from the guy in the shipping container, you'll find another corpse in the water. This one with this memorystick.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Above the red lights in the middle of the water, on that platform.",
    },
    {
      id: 4,
      title: "Can - The Machinetta Cafe Latte",
      text: "Push all three storage trolleys on the pressure plates and this will drop from the crane.",
    }
  ];

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Wasteland",
    "Plant"
  );

  return (
    <section>
      <Header id="plant" title="▽ Plant Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default Plant
