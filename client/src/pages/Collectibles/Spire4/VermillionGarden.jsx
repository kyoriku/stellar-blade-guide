import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getVermillionGarden } from '../../../utils/API/spire4';

const VermillionGarden = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Nano Suit - Photogenic",
      text: "After leaving the boss fight arena, this crate is in the next room, straight ahead of you.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "There's a supply box beside the crate with the Nano Suit.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Inside the elevator shaft, take the first moving yellow ledge and jump off to the right to find the crate. Contains 2 Omnibolts and Risk Taking Gear (3 star)",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "After taking the third moving yellow ledge, the next crate will be on the left side.",
    },
  ];

  useEffect(() => {
    fetchVermillionGardenCollectibles();
  }, []);

  const fetchVermillionGardenCollectibles = async () => {
    try {
      const data = await getVermillionGarden();
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
      <Header id="vermillion-garden" title="▽ Vermillion Garden Collectibles" />
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

export default VermillionGarden
