import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getScrapPlainsContinued } from "../../../utils/API/wasteland";

const ScrapPlainsContinued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Junkyard",
      text: "When you get through the wallrunning tutorial as you head south, there'll be a camp on the left.",
    },
    {
      id: 2,
      title: "Can - Pixie Zero",
      text: "Just nearby the previous one, head to the northern edge and shoot the 3 girders where the drone is. Doing that will cause the drone to fly upwards and dig up a can for you.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Northwest of the Junkyard Supply Camp, before you get on the path to the northwest and then northeast, there's a small dead end to the east.",
    },
    {
      id: 4,
      title: "Memorystick - Albert's Memory",
      text: "Follow the path to the top to a load of crates and building materials. This dead body is on the other side of them.",
    },
    {
      id: 5,
      title: "Memorystick - Aaron's Memory / Passcode - aSaSaS",
      text: "Hit the button near Albert's body, and then shoot the targets in the same order they appear to unlock where they came from. Down there is Aaron's body (and a passcode for Xion: aSaSaS).",
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Southeast of the Junkyard Supply Camp is a chest, near a drone. Code to get in is 0nrrrS.",
    }
  ];

  useEffect(() => {
    fetchScrapPlainsContinuedCollectibles();
  }, []);

  const fetchScrapPlainsContinuedCollectibles = async () => {
    try {
      const data = await getScrapPlainsContinued();
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
      <Header id="scrap-plains-continued" title="▽ Scrap Plains Collectibles (Continued)" />
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

export default ScrapPlainsContinued;
