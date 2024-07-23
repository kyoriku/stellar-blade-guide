import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getForbiddenArea } from "../../../utils/API/wasteland";
import { Skeleton } from "@mui/material";

const ForbiddenArea = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Can - Cryo The Clear",
      text: "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the “Life of the Scavengers” side quest.",
    },
    {
      id: 2,
      title: "Memorystick - Tommy's Testament",
      text: "Interact with Tommy's body after defeating the Brute.",
    },
    {
      id: 3,
      title: "Nano Suit - Sporty Yellow",
      text: "In a chest where the Brute came from in the Forbidden Area. Directly behind Tommy's body.",
    }
  ];

  useEffect(() => {
    fetchForbiddenAreaCollectibles();
  }, []);

  const fetchForbiddenAreaCollectibles = async () => {
    try {
      const data = await getForbiddenArea();
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
      <hr id="forbidden-area"></hr>
      <h3>▽ Forbidden Area Collectibles</h3>
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

export default ForbiddenArea
