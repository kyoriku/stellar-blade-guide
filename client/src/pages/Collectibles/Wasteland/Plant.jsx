import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getPlant } from "../../../utils/API/wasteland";

const Plant = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Luke's Memory",
      text: "At the bottom of the water in the middle of the Plant.",
    },
    {
      id: 2,
      title: "Memorystick - Go's Memory",
      text: "Once you pick up the “Incarceration” side quest from the guy in the shipping container, you'll find another corpse in the water. This one with this memorystick.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Above the red lights in the middle of the water, on that platform.",
    },
    {
      id: 4,
      title: "Can - The Machinetta Cafe Latte",
      text: "Push all three storage trolleys on the pressure plates and this will drop from the crane.",
    }
  ];

  useEffect(() => {
    fetchPlantCollectibles();
  }, []);

  const fetchPlantCollectibles = async () => {
    try {
      const data = await getPlant();
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
      <Header id="plant" title="▽ Plant Collectibles" />
      <ErrorMessage message={error} />
      {!error && (
        <div>
          {staticContent.map((item, index) => (
            <article key={item.id}>
              <ContentText title={item.title} text={item.text} />
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
              )}
              <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Plant
