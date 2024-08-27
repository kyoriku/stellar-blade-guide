import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getTopSecretResearchComplex } from '../../../utils/API/altessLevoire';

const TopSecretResearchComplex = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right.",
    },
  ];

  useEffect(() => {
    fetchTopSecretResearchComplexCollectibles();
  }, []);

  const fetchTopSecretResearchComplexCollectibles = async () => {
    try {
      const data = await getTopSecretResearchComplex();
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
      <Header id="top-secret-research-complex" title="▽ Top Secret Research Complex Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default TopSecretResearchComplex
