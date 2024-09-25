import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'scrapPlainsContinuedData';

const ScrapPlainsContinued = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Junkyard",
      text: "When you get through the wallrunning tutorial as you head south, there'll be a camp on the left.",
    },
    {
      id: 2,
      title: "Can - Pixie Zero",
      text: "Just nearby the previous one, head to the northern edge and shoot the 3 girders where the drone is. Doing that will cause the drone to fly upwards and dig up a can for you.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Northwest of the Junkyard Supply Camp, before you get on the path to the northwest and then northeast, there's a small dead end to the east.",
    },
    {
      id: 4,
      title: "Memorystick - Albert's Memory",
      text: "Follow the path to the top to a load of crates and building materials. This dead body is on the other side of them.",
    },
    {
      id: 5,
      title: "Memorystick - Aaron's Memory / Passcode - αζαζαζ",
      text: "Hit the button near Albert's body, and then shoot the targets in the same order they appear to unlock where they came from. Down there is Aaron's body (and a passcode for Xion: αζαζαζ).",
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Southeast of the Junkyard Supply Camp is a chest, near a drone. Code to get in is 0nrrrS.",
    }
  ];

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Wasteland",
    "Scrap-Plains-(Continued)"
  );

  return (
    <section>
      <Header id="scrap-plains-continued" title="▽ Scrap Plains Collectibles (Continued)" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ScrapPlainsContinued;
