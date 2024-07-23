import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getPlant } from "../../../utils/API/wasteland";
import { Skeleton } from "@mui/material";

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
    <div>
      <hr id="plant"></hr>
      <h3>▽ Plant Collectibles</h3>
      <hr className="w-75"></hr>
      {error && <p className="error-message">{error}</p>}
      {staticContent.map((item, index) => (
        <div key={item.id}>
          <p>
            <strong>{item.title}</strong>
            <span> &#8211; </span>
            {item.text}
          </p>
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
          {index !== content.length - 1 && <hr />}
        </div>
      ))}
    </div>
  );
};

export default Plant
