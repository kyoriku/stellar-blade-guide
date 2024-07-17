import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getMemoryTower } from '../../../utils/API/eidos7';
import { Skeleton } from "@mui/material";

const MemoryTower = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Northwest of where you enter the plaza, down a metal walkway, and into an alleyway. The box is there.",
    },
    {
      id: 2,
      title: "Memorystick - Artemis 132's Credentials",
      text: "South of the pillar (that leads to the Hall of Records) you see when you get into the area is a corpse.",
    },
    {
      id: 3,
      title: "Memorystick - Artemis 8's Orders / Passcode - yuak0k",
      text: "To the east of the pillar in the plaza is another corpse.",
    },
    {
      id: 4,
      title: "Memorystick - Artemis 49's Reply",
      text: "On the south side of the area where you fought the Corrupter is a corpse with this memorystick.",
    },
    {
      id: 5,
      title: "Beta Core",
      text: "In Northeast corner of the Corrupter battle area there's an alleyway. Head down it slightly (just down the stairs), and to the right is a corpse with this Beta Core on it. Inside The Red Grill (with flashing neon 'closed' sign).",
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "In the northeast corner of the upstairs area is a Legion Supply Box.",
    },
    {
      id: 7,
      title: "Robot - Tumbler Expansion Module",
      text: "At the end of the road (don't go up the ladder yet) is a relic robot. Destroy it to get the Tumbler Expansion Module.",
    },
    {
      id: 8,
      title: "Legion Camp",
      text: "Up the ladder and to the north is the next camp.",
    },
    {
      id: 9,
      title: "Memorystick - Legionnaire 214's Testament",
      text: "Just to the north of the camp is a corpse with this memorystick.",
    }
  ]

  useEffect(() => {
    fetchMemoryTowerCollectibles();
  }, []);

  const fetchMemoryTowerCollectibles = async () => {
    try {
      const data = await getMemoryTower();
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
      <hr id="memory-tower"></hr>
      <h3>▽ Memory Tower Collectibles</h3>
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
                height={219}
                width={388}
                variant="rounded"
                className="skeleton-item"
              />
              <Skeleton
                animation="wave"
                height={219}
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

export default MemoryTower;
