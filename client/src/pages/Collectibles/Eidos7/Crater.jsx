import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getCrater } from '../../../utils/API/eidos7';
import { Skeleton } from "@mui/material";

const Crater = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Legionnaire 274's Memory",
      text: "By a rock as soon as you enter the Crater area (near the small bit of water).",
    },
    {
      id: 2,
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss.",
    }
  ];

  useEffect(() => {
    fetchCraterCollectibles();
  }, []);

  const fetchCraterCollectibles = async () => {
    try {
      const data = await getCrater();
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
      <hr id="crater"></hr>
      <h3>▽ Crater Collectibles</h3>
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

export default Crater;