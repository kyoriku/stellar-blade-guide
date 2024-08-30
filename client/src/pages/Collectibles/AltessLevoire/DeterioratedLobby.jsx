import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getDeterioratedLobby } from '../../../utils/API/altessLevoire';

const DeterioratedLobby = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "After you beat the ambush and make it up the lift.",
    },
    {
      id: 2,
      title: "Legion Supply Chest",
      text: "Once you've cleared the monster covering the walkway, there's a cache before you move into the next room.",
    },
    {
      id: 3,
      title: "Passcode - μηλαμη",
      text: "Head past the locked door that needs a keycode, go through the door with the green light next to it, and then there'll be a body on the right down there with a passcode.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Carry on to the end of the corridor until you reach a door. Inside is a dead end, but also a Legion Supply Box.",
    },
  ];

  useEffect(() => {
    fetchDeterioratedLobbyCollectibles();
  }, []);

  const fetchDeterioratedLobbyCollectibles = async () => {
    try {
      const data = await getDeterioratedLobby();
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
      <Header id="deteriorated-lobby" title="▽ Deteriorated Lobby Collectibles" />
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

export default DeterioratedLobby;
