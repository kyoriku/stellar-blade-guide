import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getClosedLobby } from '../../../utils/API/abyssLevoire';

const ClosedLobby = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Nano Suit - Planet Diving Suit (3rd)",
      text: "Instead of heading to the right and going to the yellow box, there's an offshoot in the right-hand corridor to the right. Head in there, defeat all the enemies, while avoiding all the lasers, and this Nano Suit is all yours.",
    },
    {
      id: 2,
      title: "Document - Log Data - Cultivation Experiment",
      text: "In the room with both control booths, the one in the right-hand corner has a PC on in the corner. Interact with it for this document.",
    },
  ];

  useEffect(() => {
    fetchClosedLobbyCollectibles();
  }, []);

  const fetchClosedLobbyCollectibles = async () => {
    try {
      const data = await getClosedLobby();
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
      <Header id="closed-lobby" title="▽ Closed Lobby Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ClosedLobby
