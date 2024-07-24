import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getSecurityCenter } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const SecurityCenter = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - Humanity Liberation Front",
      text: "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right.",
      type: "Document",
      level: "Altess Levoire",
      location: "Security Center",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/3-SecurityCenter/1-Document - Messages - Humanity Liberation Front.jpg",
          alt: "Document - Messages - Humanity Liberation Front"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Supply Chest",
      text: "By the door you just opened. Can't miss it.",
      type: "Supply Chest",
      level: "Altess Levoire",
      location: "Security Center",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/3-SecurityCenter/2-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    }
  ];

  useEffect(() => {
    fetchSecurityCenterCollectibles();
  }, []);

  const fetchSecurityCenterCollectibles = async () => {
    try {
      const data = await getSecurityCenter();
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
      <hr id="security-center"></hr>
      <h3>▽ Security Center Collectibles</h3>
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
                height={443.5}
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

export default SecurityCenter
