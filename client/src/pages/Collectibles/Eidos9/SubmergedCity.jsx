import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getSubmergedCity } from '../../../utils/API/eidos9';

const SubmergedCity = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Backtrack onto the monorail and follow it until it branches paths. Follow the left path, which should lead you to a giant red slide, then go down it. There will be a camp at the bottom of the slide.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "After the ambush is defeated, there will be a crate inside the small building to the right.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "From the previous crate, go behind the building and climb on top. Go across the wall running section and then climb up onto the next rooftop. There will be a crate behind the fenced area once you're up top.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "From the previous crate, drop down to the street level and there will be a crate in the corner.",
    },
    {
      id: 5,
      title: "Document - Books - Book of Quotes 2",
      text: "From the previous crate, climb back up and follow the pathway and you'll have to climb up some vents. Once you're done climbing the vents, the document will be on the ground ahead.",
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "From the previous collectible, climb the ladder and the chest will be on the left after walking through the fence. The chest will be another sound puzzle.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "From the previous crate, swing across the ropes and then enter the small building at the end. There will be a crate inside.",
    },
    {
      id: 8,
      title: "Supply Camp - Submerged City",
      text: "From the previous crate, climb up the building and there will be a camp once you're at the top, before climbing up the ladder.",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "On the south side of the boss arena, contains Omnibolts and 3 star Combat Continuation Gear.",
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "After making it back to the original monorail, go down the grey slide to where a Cocoon is. There will be a crate beside the button that lowers the rope to get off the island.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Head back to the parking garage roof and head northeast this time. Defeat the Cocoon and head east down the stairs. Under said stairs is another crate.",
    },
    {
      id: 12,
      title: "Legion Camp",
      text: "Up the ladder from the final Cocoon. Before taking the second ladder to the top, there's a camp on your left.",
    },
    {
      id: 13,
      title: "Nano Suit - Motivation",
      text: "After clearing all 6 Cocoons, you'll need to follow the objective down a red slide. There will be a Dozer and a Hydra at the end. After they're defeated, climb up the small roof, where the crate is.",
    },
  ];


  useEffect(() => {
    fetchSubmergedCityCollectibles();
  }, []);

  const fetchSubmergedCityCollectibles = async () => {
    try {
      const data = await getSubmergedCity();
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
      <Header id="submerged-city" title="▽ Submerged City Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default SubmergedCity
