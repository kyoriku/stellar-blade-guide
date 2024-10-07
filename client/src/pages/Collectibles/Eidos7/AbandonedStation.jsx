import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { useCachedCollectibles } from "../../../hooks/useCachedCollectibles";

const AbandonedStation = () => {
  const { content, isLoading, error } = useCachedCollectibles("Eidos-7", "Abandoned-Station");
  
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Respite of the Hopeful / Passcode - δβμκδβ",
      text: "After entering the flooded facility, to the right of the first door (north wall) is a corpse underwater with both this memorystick and passcode.",
    },
    {
      id: 2,
      title: "Supply Camp - Abandoned Station",
      text: "Up the elevator shaft in the Abandoned Station.",
    },
    {
      id: 3,
      title: "Memorystick - Legionnaire 244's Memory",
      text: "As you get out of the monorail on the other side.",
    },
    {
      id: 4,
      title: "Nano Suit - Planet Diving Suit (7th) V2",
      text: "In the southwest corner, in a small room, in the tram station at the beginning of the level (before heading outside towards the objective).",
    },
  ];

  return (
    <section>
      <Header id="abandoned-station" title="▽ Abandoned Station Collectibles" />
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

export default AbandonedStation;
