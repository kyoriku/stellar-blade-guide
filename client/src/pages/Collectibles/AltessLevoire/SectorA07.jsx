import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getSectorA07 } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const SectorA07 = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Security Procedure Guide",
      text: "After the symbol floor puzzle, on the right before you go through the next door.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Through the door, on your left",
    }
  ];

  useEffect(() => {
    fetchSectorA07Collectibles();
  }, []);

  const fetchSectorA07Collectibles = async () => {
    try {
      const data = await getSectorA07();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const shouldRenderHr = (index) => {
    if (isLoading) return index < staticContent.length - 1;
    return index < staticContent.length - 1;
  };

  return (
    <div>
      <hr id="sector-a07"></hr>
      <h3>▽ Sector A07 Collectibles</h3>
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
          {shouldRenderHr(index) && <hr />}
          </div>
      ))}
    </div>
  );
};

export default SectorA07
