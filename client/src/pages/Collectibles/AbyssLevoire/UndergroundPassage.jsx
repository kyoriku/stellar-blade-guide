import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getUndergroundPassage } from '../../../utils/API/abyssLevoire';

const UndergroundPassage = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Attack Detected",
      text: "From the previous camp, go into the next room and jump into the control room through the window. The document is on the floor near the blocked stairs.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "In the room directly after the long hallway where you have to fight waves of enemies",
    },
    {
      id: 3,
      title: "Locked Supply Chest",
      text: "After turning off the lasers, go across to the other side of the room and before going through the door, climb up the elevator shaft on the right. There will be a crate at the top where you'll need to do another arrow direction puzzle to open it.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Once you enter the overgrown hallway, keep going forward and then there will be a crate on the left end of the hallway.",
    },
    {
      id: 5,
      title: "Legion Camp",
      text: "On the opposite side from the supply box, through the door.",
    }
  ];

  useEffect(() => {
    fetchUndergroundPassageCollectibles();
  }, []);

  const fetchUndergroundPassageCollectibles = async () => {
    try {
      const data = await getUndergroundPassage();
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
      <Header id="underground-passage" title="▽ Underground Passage Collectibles" />
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

export default UndergroundPassage
