import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getAirVent } from '../../../utils/API/altessLevoire';

const AirVent = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Locked Legion Supply Box",
      text: "On the walkway between fans, after doing the fan set-piece. It needs the Hacking Tool, but don't worry if you don't have it, as it's just a lot of Nano Elements.",
    },
    {
      id: 2,
      title: "Locked Supply Chest",
      text: "By the next set of ladders up (d-pad mini-game inbound!).",
    },
    {
      id: 3,
      title: "Robot - Tumbler Expansion Module",
      text: "Up the next ladder, and then do a 180 and hop over the barrier. There you'll find a robot.",
    },
    {
      id: 4,
      title: "Supply Camp",
      text: "Next to both sets of ladders.",
    }
  ];

  useEffect(() => {
    fetchAirVentCollectibles();
  }, []);

  const fetchAirVentCollectibles = async () => {
    try {
      const data = await getAirVent();
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
      <Header id="air-vent" title="▽ Air Vent Collectibles" />
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

export default AirVent
