import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getMaintenanceSector } from '../../../utils/API/spire4';

const MaintenanceSector = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Once you reach the Maintenance Sector, you can reach the camp by going across the beams on the right end of the room.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "From the camp, go across the wall running section and follow the swing bars to the next floor. The crate will be to your right once you're on the next floor.",
    },   
  ];


  useEffect(() => {
    fetchMaintenanceSectorCollectibles();
  }, []);

  const fetchMaintenanceSectorCollectibles = async () => {
    try {
      const data = await getMaintenanceSector();
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
      <Header id="maintenance-sector" title="▽ Maintenance Sector Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default MaintenanceSector
