import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getAirVent } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const AirVent = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Locked Legion Supply Box",
      text: "On the walkway between fans, after doing the fan set-piece. It needs the Hacking Tool, but don't worry if you don't have it, as it's just a lot of Nano Elements.",
    },
    {
      id: 2,
      title: "Locked Supply Chest",
      text: "By the next set of ladders up (d-pad mini-game inbound!).",
    },
    {
      id: 3,
      title: "Robot - Tumbler Expansion Module",
      text: "Up the next ladder, and then do a 180 and hop over the barrier. There you'll find a robot.",
    },
    {
      id: 4,
      title: "Supply Camp",
      text: "Next to both sets of ladders.",
    }
  ];

  useEffect(() => {
    fetchAirVentCollectibles();
  }, []);

  const fetchAirVentCollectibles = async () => {
    try {
      const data = await getAirVent();
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
      <hr id="air-vent"></hr>
      <h3>▽ Air Vent Collectibles</h3>
      <hr className='w-75'></hr>
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
                height={443}
                width={796}
                variant="rounded"
                className="skeleton-item"
              />
            </div>
          ) : (
            <MediaDisplay
              images={content.find((data) => data.id === item.id)?.images || []}
            />
          )}
          <hr></hr>
          </div>
      ))}
    </div>
  );
};

export default AirVent
