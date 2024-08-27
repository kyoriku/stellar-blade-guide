import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getLaboratoryRuins } from '../../../utils/API/abyssLevoire';

const LaboratoryRuins = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Locked Supply Chest",
      text: "Go through the platforming section until you get to the spot where you have to jump to a ladder. There will be a small room to the left of the ladder you can jump into where the chest will be, being guarded by a Barnacle.",
    },
    {
      id: 2,
      title: "Robot - Tumbler Expansion Module",
      text: "After climbing up the ladder and jumping over to the next platform, there will be a robot that will drop the Tumbler Expansion Module on the next platform directly across from you.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "After swinging over the gap with the rope and making your way up a sloped walkway, there's a supply box in there with a couple of enemies.",
    },
    {
      id: 4,
      title: "Document - Log Data - Mass Production",
      text: "On top of the tall box to the right of the previous supply box.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "From the previous collectibles, go up the rope and then turn around. There will be a crate on a narrow platform you can drop down too.",
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "From the previous supply box, go across the wall running section and jump across the swing bars to the rope. You'll be able to then swing to the left onto another platform with a crate that has a directional puzzle to open.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "After sliding down the ladder with the blue lights, there will be a crate right beside you once you reach the bottom.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "From the previous collectible, drop down to the walkway below you and instantly turn around. There will a crate at the end of the walkway.",
    },
    {
      id: 9,
      title: "Document - Log Data - Quarantine Failure",
      text: "After making your way through the Laboratory Ruins, there will be a document to the left of the door in the red hallway that leads to the room with the camp.",
    },
    {
      id: 10,
      title: "Supply Camp",
      text: "After crossing the large room, on the right before the boss fight."
    }
  ];

  useEffect(() => {
    fetchLaboratoryRuinsCollectibles();
  }, []);

  const fetchLaboratoryRuinsCollectibles = async () => {
    try {
      const data = await getLaboratoryRuins();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header id="laboratory-ruins" title="▽ Laboratory Ruins Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        alwaysShowFinalHr={true}
      />
    </section>
  );
};

export default LaboratoryRuins
