import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getDeterioratedLobby } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const DeterioratedLobby = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "After you beat the ambush and make it up the lift.",
    },
    {
      id: 2,
      title: "Legion Supply Chest",
      text: "Once you've cleared the monster covering the walkway, there's a cache before you move into the next room.",
    },
    {
      id: 3,
      title: "Passcode - unyaun",
      text: "Head past the locked door that needs a keycode, go through the door with the green light next to it, and then there'll be a body on the right down there with a passcode.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Carry on to the end of the corridor until you reach a door. Inside is a dead end, but also a Legion Supply Box.",
    },
  ];

  useEffect(() => {
    fetchDeterioratedLobbyCollectibles();
  }, []);

  const fetchDeterioratedLobbyCollectibles = async () => {
    try {
      const data = await getDeterioratedLobby();
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
      <hr id="deteriorated-lobby"></hr>
      <h3>▽ Deteriorated Lobby Collectibles</h3>
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

export default DeterioratedLobby;