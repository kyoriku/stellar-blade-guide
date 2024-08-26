import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getTowerOuterWall } from '../../../utils/API/spire4';

const TowerOuterWall = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Robot - Drone Upgrade Module",
      text: "Once you're outside going across the beams, jump across to another beam and follow it to the end. Once you're at the end, climb up the yellow ledges to find a robot that will drop the Drone Upgrade Module.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Once you're back inside the building, drop down and there will be a crate underneath you.",
    },
    {
      id: 3,
      title: "Can - Moonwell",
      text: "From the previous crate, after defeating the Machine Hive, you can jump around the wall to the right and there will be a vending machine at the end with the can inside. If you miss this one, you can fish it up from the Oasis in the Great Desert using Strange Bait after finishing Spire 4",
    },
  ];

  useEffect(() => {
    fetchTowerOuterWallCollectibles();
  }, []);

  const fetchTowerOuterWallCollectibles = async () => {
    try {
      const data = await getTowerOuterWall();
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
      <Header id="tower-outer-wall" title="▽ Tower Outer Wall Collectibles" />
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

export default TowerOuterWall
