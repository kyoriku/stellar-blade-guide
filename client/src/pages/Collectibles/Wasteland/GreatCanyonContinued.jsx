import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getGreatCanyonContinued } from "../../../utils/API/wasteland";
import { Skeleton } from "@mui/material";

const GreatCanyonContinued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp - Eastern Great Canyon",
      text: "In the south east corner of the area just before you take the elevator down towards Altess Levoire.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 295's Orders",
      text: "To the left of the lift (slightly west of the Eastern Great Canyon Legion Camp).",
    },
    {
      id: 3,
      title: "Exospine - Eagle Eye-Type",
      text: "To the right of the lift that leads down towards the main mission objective.",
    },
    {
      id: 4,
      title: "Memorystick - Scavenger 216's Advice",
      text: "Head southwest from the bottom of the lift to the gate. The human body with with memorystick is there.",
    },
    {
      id: 5,
      title: "Document - Prayers - Chapter of Trial 6 - S",
      text: "From the elevator, heading northwest, before the path goes directly west, on the right (east) is a dead end. In that southern wall is a small cave with a shrine in it.",
    },
    {
      id: 6,
      title: "Body Core",
      text: "As the path bends west, go east and destroy the crates. There's a corpse with a Body Core hidden by said crates.",
    },
    {
      id: 7,
      title: "Supply Camp - Altess Levoire Entrance",
      text: "Directly before the entrance to Altess Levoire.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East of the entrance to Altess Levoire is a gate. Go through it towards the other gate, and then turn north and climb the cliffs to the top. Then, head south and jump over the gap to another set of rocks. There's a chest up there. Inside is an Omnibolt and Fixed Damage Gear (2 star).",
    },
    {
      id: 9,
      title: "Document - Series - The Truth, Article 1",
      text: "Drop down a level and head east to the end where you will see a newspaper dispenser. Interact with it for this document. There's also a Drone Upgrade Module beside it.",
    },
    {
      id: 10,
      title: "Nano Suit - Crew Style (NG+ Only)",
      text: "From there, head back west and traverse the cliff on the southwest side. Before you cross the bridge there's a Nano Suit box there, on the right.",
    },
    {
      id: 11,
      title: "Memorystick - Sentinel 65's Testament",
      text: "Cross the bridge and drop into the courtyard down below.",
    },
    {
      id: 12,
      title: "Can - GrainT Barley",
      text: "Solve the pressure plate puzzle in the same area, by putting all 3 carts on the left-hand pressure plate (so it reads 23 on the left and 3 on the right).",
    },
  ];

  useEffect(() => {
    fetchGreatCanyonContinuedCollectibles();
  }, []);

  const fetchGreatCanyonContinuedCollectibles = async () => {
    try {
      const data = await getGreatCanyonContinued();
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
      <hr id="great-canyon-continued"></hr>
      <h3>▽ Great Canyon Collectibles (Continued)</h3>
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

export default GreatCanyonContinued
