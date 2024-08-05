import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getLandfill } from "../../../utils/API/matrix11";

const Landfill = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "On the opposite side of the upper terrace as you reach the landfill area.",
    },
    {
      id: 2,
      title: "Memorystick - Employee 33's Determination",
      text: "Head down the lift and downstairs, where the Mites are, is a body with this memorystick.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "On the left-hand side of the actual landfill, up a level from the garbage and the enemies.",
    },
    {
      id: 4,
      title: "Locked Supply Chest",
      text: "In the middle of the landfill area. Passcode is from the body before (ardu0d). Also contains the Fusion Cell.",
    },
    {
      id: 5,
      title: "Memorystick - Legionnaire 507's Regret",
      text: "As you come out of the landfill (after using the Fusion Cell), on the right, on the train tracks.",
    },
    {
      id: 6,
      title: "Body Core",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it.",
    },
    {
      id: 7,
      title: "Legion Camp",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it.",
    },
  ];

  useEffect(() => {
    fetchLandfillCollectibles();
  }, []);

  const fetchLandfillCollectibles = async () => {
    try {
      const data = await getLandfill();
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
      <Header id="landfill" title="▽ Landfill Collectibles" />
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

export default Landfill;
