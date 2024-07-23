import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getScrapYard } from "../../../utils/API/wasteland";
import { Skeleton } from "@mui/material";

const ScrapYard = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Scrap Yard Entrance",
      text: "Follow the path down from the northeast and you'll come to a small robot town (Scrap Yard), as well as this Supply Camp.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "in the northeast corner of the Scrap Yard, but even with a yellow box, the ladder appears not to have collision detection. Come back when you have the Double Jump if you can't get it.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "There's another one in the south corner of the area. Climb up and jump over a fence to reach the back wall.",
    },
    {
      id: 4,
      title: "Available to purchase from D1G-g2r:",
      text: [
        "2 Weapon Cores",
        "3 Tumbler Expansion Modules",
        "5 Drone Upgrade Modules",
        "3 Omnibolts",
        "Nano Element",
        "Advanced Nano Element",
        "Extreme Nano Element",
        "Document - Information - Service Drones",
        "Document - Series - Plastic Hearts, Vol. 2",
        "Document - Information - Conspiracy",
        "Oval Horn-Rimmed Glasses",
        "Metal-Framed Glasses",
        "Cat's Eye Glasses",
      ],
    },
    {
      id: 5,
      title: "D1G-g2r Level 2 Affinity:",
      text: [
        "Brown Horn-Rimmed Glasses",
        "Laboratory Goggles",
        "Polygonal-Framed Glasses",
        "Square-Framed Glasses",
      ],
    },
    {
      id: 6,
      title: "D1G-g2r Level 3 Affinity:",
      text: [
        "Classic Round Glasses",
        "Skinny Sunglasses",
        "Orange Aviators",
        "Oversized Sunglasses",
      ],
    },
    {
      id: 7,
      title: "Locked Supply Chest",
      text: "Leave D1G-g2r's Scrap Yard and head southeast. Unlock the gate (to open the shortcut) and then unlock the Locked Chest (with the d-pad mini-game).",
    },
  ];

  useEffect(() => {
    fetchScrapYardCollectibles();
  }, []);

  const fetchScrapYardCollectibles = async () => {
    try {
      const data = await getScrapYard();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderText = (text, title) => {
    if (Array.isArray(text)) {
      return (
        <div>
          <strong>{title}</strong>
          <ul>
            {text.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );
    } else {
      return (
        <p>
          <strong>{title}</strong>
          <span> &#8211; </span>
          {text}
        </p>
      );
    }
  };

  return (
    <div>
      <hr id="scrap-yard"></hr>
      <h3>▽  Scrap Yard Collectibles</h3>
      <hr className="w-75" />
      {error && <p className="error-message">{error}</p>}
      {staticContent.map((item, index) => {
        const isLastItem = index === staticContent.length - 1;
        const isNextTextArray = !isLastItem && Array.isArray(staticContent[index + 1].text);
        const showHr = !isLastItem && (!Array.isArray(item.text) || !isNextTextArray);

        return (
          <div key={item.id}>
            {renderText(item.text, item.title)}
            {isLoading ? (
              <div className="skeleton-container">
                <Skeleton
                  animation="wave"
                  height={217}
                  width={388}
                  variant="rounded"
                  className="skeleton-item"
                />
                <Skeleton
                  animation="wave"
                  height={217}
                  width={388}
                  variant="rounded"
                  className="skeleton-item"
                />
              </div>
            ) : (
              <MediaDisplay
                images={content.find((data) => data.id === item.id)?.images || []}
              />
            )}
            {showHr && <hr />}
          </div>
        );
      })}
    </div>
  );
};

export default ScrapYard;
