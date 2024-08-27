import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getHighOrbitStation } from '../../../utils/API/spire4';

const HighOrbitStation = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Beta Core",
      text: "As soon as you reach the top of the elevator shaft, instantly turn to the left to find a corpse with the Beta Core.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "There's a supply camp on the right side of the same room as the Beta Core.",
    },
  ];

  useEffect(() => {
    fetchHighOrbitStationCollectibles();
  }, []);

  const fetchHighOrbitStationCollectibles = async () => {
    try {
      const data = await getHighOrbitStation();
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
      <Header id="high-orbit-station" title="▽ High Orbit Station Collectibles" />
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

export default HighOrbitStation
