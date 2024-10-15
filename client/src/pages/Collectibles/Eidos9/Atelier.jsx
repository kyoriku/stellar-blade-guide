import React from "react";
import CollectiblesSection from "../../../components/CollectiblesSection";

const Atelier = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "After going down the red slide and reaching the floating cargo containers, right before jumping onto the main island, you can jump to the half-submerged cargo container. You'll land in the water and have to swim a little bit to the cargo container, but you shouldn't die depending on how far you managed to jump. From here, jump towards the smaller island, where there will be a crate behind the rubble.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Once you reach the Atelier, the camp will be on the pathway around to the entrance.",
    },
    {
      id: 3,
      title: "Document - Messages - What Will You Choose",
      text: "On the ground inside the Atelier.",
    },
  ];

  return (
    <CollectiblesSection
      id="atelier"
      title="Atelier"
      level="Eidos-9"
      location="Atelier"
      staticContent={staticContent}
      alwaysShowFinalHr={true}
    />
  );
};

export default Atelier
