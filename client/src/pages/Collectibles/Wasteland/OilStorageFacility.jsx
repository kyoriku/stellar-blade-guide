import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getOilStorageFacility } from "../../../utils/API/wasteland";
import { Skeleton } from "@mui/material";

const OilStorageFacility = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Lee's Complaint",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 2,
      title: "Memorystick - Woo's Record",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 3,
      title: "Memorystick - Young's Screams",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 4,
      title: "Body Core",
      text: "Right at the northside of the oil storage facility, inside a shipping container.",
    },
  ];

  useEffect(() => {
    fetchOilStorageFacilityCollectibles();
  }, []);

  const fetchOilStorageFacilityCollectibles = async () => {
    try {
      const data = await getOilStorageFacility();
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
      <hr id="oil-storage-facility"></hr>
      <h3>▽ Oil Storage Facility Collectibles Collectibles</h3>
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

export default OilStorageFacility;
