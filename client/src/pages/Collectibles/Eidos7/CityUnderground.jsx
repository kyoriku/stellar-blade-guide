import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles"

const CityUnderground = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "After crossing over the steel beam, this camp is through the door on the left.",
    },
    {
      id: 2,
      title: "Locked Legion Supply Chest",
      text: "At the first crossroads, there's a chest you can't miss on the corner at the intersection.",
    },
    {
      id: 3,
      title: "Memorystick - Legionnaire 220's Memory",
      text: "Follow the southern corridor to the end, and before going outside there's a human corpse on the right at the end.",
    },
    {
      id: 4,
      title: "Body Core",
      text: "Head outside from the previous human corpse and you'll find another human with a Body Core.",
    },
    {
      id: 5,
      title: "Robot - Tumbler Expansion Module",
      text: "Head down the west tunnel now, but before you head right at the end, take the northern tunnel down to the end. At the end is a robot with this relic.",
    },
    {
      id: 6,
      title: "Memorystick - Legionnaire 498's Wish",
      text: "In the same area, head into the water behind the robot and you'll find another human corpse.",
    },
    {
      id: 7,
      title: "Memorystick - Legionnaire 248's Complaint",
      text: "After the tunnel collapses a bit, and you have to jump down onto the pipe, at the top look left. There's another human corpse there.",
    },
    {
      id: 8,
      title: "Beta Core",
      text: "After climbing up to the top (after the pipe section), instead of going north and down the hole, head northeast and down that hole. There's a human dead body there with this core on it.",
    },
    {
      id: 9,
      title: "Memorystick - Lament of the Disappointed",
      text: "After getting back on course from the previous collectible and dropping down the hole, there's a human corpse as you drop with this memorystick on it.",
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "Use the pole to get across the gap and take the rope down. There's a human corpse down there (with no memorystick). However, behind said corpse is this supply box. There's also another corpse (only XP) down there too.",
    },
    {
      id: 11,
      title: "Legion Camp",
      text: "Take the rope back up, go left down the tunnel and then right to find this camp.",
    },
    {
      id: 12,
      title: "Memorystick - Legionnaire 268's Prayer",
      text: "Follow the corridor directly ahead of the camp to the end and head right. There's a human corpse at the end. Also includes the Floodgate Key.",
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "There's a box just behind the aforementioned corpse. Includes an Omnbolt and Speed Increase Gear.",
    },
    {
      id: 14,
      title: "Robot - Drone Upgrade Module",
      text: "When Adam says the exit is to the right (after opening the second floodgate), down that corridor to the right is this bot and this relic.",
    }
  ];

  useEffect(() => {
    fetchCityUndergroundCollectibles();
  }, []);

  const fetchCityUndergroundCollectibles = async () => {
    try {
      const data = await getCollectiblesByLevelAndLocation('Eidos-7', 'City-Underground');
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
      <Header id="city-underground" title="▽ City Underground Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default CityUnderground;
