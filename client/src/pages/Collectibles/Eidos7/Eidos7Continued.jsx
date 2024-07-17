import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getEidos7Continued } from '../../../utils/API/eidos7';
import { Skeleton } from "@mui/material";

const Eidos7Continued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Locked Legion Supply Chest",
      text: "In Bar 99 on Silent Street, you can now open this cache if you picked up the “Legion's Secret Stash”Request. Code is 1228.",
    },
    {
      id: 2,
      title: "Document - Books - The Words of the Devout Felix",
      text: " As part of “The Words of the Mother Sphere” side quest (from Francis, at the book shop in Xion). In the library near Silent Street.",
    },
    {
      id: 3,
      title: "Documents - Announcements - :::WARNING:::",
      text: "Head back to the Hall of Records, and interact with the plinth in the plaza, as part of the “Taboo” side quest.",
    },
    {
      id: 4,
      title: "Earrings - Hanging Memory",
      text: "Return to where you fought the Gigas when you have the “Generous Drop Pod” Request.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "In the northwest corner of the Flooded Commercial Sector, if you drop down to the near where you lifted the floodgates.",
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "Take the ramp down into the proper main area of the commercial sector. There's a supply box in the northwest corner.",
    },
    {
      id: 7,
      title: "Robot - Passcode",
      text: "In the path to the east of the Wayfield Diner (pretty much underneath it) is a robot with the passcode needed for the next chest.",
    },
    {
      id: 8,
      title: "Locked Legion Supply Chest",
      text: "In the southwest corner, on one of the balconies, inside the Wayfield Diner (pretty much above the previous robot).",
    },
    {
      id: 9,
      title: "Can - Elixir Carrot",
      text: "Head north from where you found the robot and inside The Red Grill (with a flashing neon red closed sign) is this can.",
    },
    {
      id: 10,
      title: "Nano Suit - Wasteland Adventurer",
      text: "Head down a level by the nearby rope (south of the can) and in the southwest corner is this Nano Suit design.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Follow the path around to the northwest and climb the ramps to the top. There's a supply chest up there.",
    },
    {
      id: 12,
      title: "Can - Cryo Original",
      text: "Head back down and follow the path around to the southeast. After passing the liquor store, you'll come across a Fizz machine on the left.",
    },
    {
      id: 13,
      title: "Memorystick - She Is Here",
      text: "As part of the Oblivion side quest, you'll head to Warehouse 77, where you'll find this inside along with the next 5 collectibles.",
    },
    {
      id: 14,
      title: "Memorystick - Help",
      text: "Inside Warehouse 77, at the bottom of the ladder.",
    },
    {
      id: 15,
      title: "Memorystick - Book of Faith and Wisdom 2:3-6",
      text: "Inside Warehouse 77, also at the bottom of the ladder.",
    },
    {
      id: 16,
      title: "Memorystick - A Melancholic Cry",
      text: "Inside Warehouse 77, also at the bottom of the ladder.",
    },
    {
      id: 17,
      title: "Memorystick - Memory of Despair",
      text: "Inside Warehouse 77, also at the bottom of the ladder.",

    },
    {
      id: 18,
      title: "Memorystick - Voice of Objection",
      text: "Inside Warehouse 77, on the small section above the other bodies.",
    },
    {
      id: 19,
      title: "Document - Journal - Survival Journal",
      text: "Part of the “End of the Nightmare” side quest in the previously flooded Commercial District (have to lift the floodgates, fast-travel to a different place, and then return to Eidos 7 for this one to appear).  North side of the river, at the lowest level you can go",
    }
  ];

  useEffect(() => {
    fetchEidos7ContinuedCollectibles();
  }, []);

  const fetchEidos7ContinuedCollectibles = async () => {
    try {
      const data = await getEidos7Continued();
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
      <hr id="eidos-7-continued"></hr>
      <h3>▽ Eidos 7 Collectibles (Continued)</h3>
      <p><i>The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them.</i></p>
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

export default Eidos7Continued;