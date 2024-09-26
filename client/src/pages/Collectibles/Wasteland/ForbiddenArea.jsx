import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'forbiddenAreaData';

const ForbiddenArea = () => {
  const staticContent = [
    {
      id: 1,
      title: "Can - Cryo The Clear",
      text: "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the “Life of the Scavengers” side quest.",
    },
    {
      id: 2,
      title: "Memorystick - Tommy's Testament",
      text: "Interact with Tommy's body after defeating the Brute.",
    },
    {
      id: 3,
      title: "Nano Suit - Sporty Yellow",
      text: "In a chest where the Brute came from in the Forbidden Area. Directly behind Tommy's body.",
    }
  ];

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Wasteland",
    "Forbidden-Area"
  );

  return (
    <section>
      <Header id="forbidden-area" title="▽ Forbidden Area Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ForbiddenArea
