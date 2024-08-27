import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getPurificationScanner } from '../../../utils/API/altessLevoire';

const PurificationScanner = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Booting Sequence",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor.",
    },
  ];

  useEffect(() => {
    fetchPurificationScannerCollectibles();
  }, []);

  const fetchPurificationScannerCollectibles = async () => {
    try {
      const data = await getPurificationScanner();
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
      <Header id="purification-scanner" title="▽ Purification Scanner Collectibles" />
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

export default PurificationScanner
