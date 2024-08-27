import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getNest } from '../../../utils/API/spire4';

const Nest = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "When back on earth, going to fight the Elder Naytiba, this camp is on the left after you see the message from Raven.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "In the nest on the right.",
    },
  ];

  useEffect(() => {
    fetchNestCollectibles();
  }, []);

  const fetchNestCollectibles = async () => {
    try {
      const data = await getNest();
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
      <Header id="nest" title="▽ Nest Collectibles" />
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

export default Nest
