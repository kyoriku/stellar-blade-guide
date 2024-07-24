import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getSpecimenPreservationLab } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const SpecimenPreservationLab = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Chest",
      text: "Up the ladder as you enter, and then head to the right and open the door on your right. Watch out for the 2 Infectors inside.",
    },
    {
      id: 2,
      title: "Document - Announcements - Visitor Information",
      text: "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "When you head back towards the ladder (clockwise), a door that was previously closed is now open. There's a box inside.",
    },
    {
      id: 4,
      title: "Robot - Document - Promotions - Eidos Company Promotion",
      text: "In the far left room (as if you were facing the way you came in), there's a robot in there now.",
    }
  ];

  useEffect(() => {
    fetchSpecimenPreservationLabCollectibles();
  }, []);

  const fetchSpecimenPreservationLabCollectibles = async () => {
    try {
      const data = await getSpecimenPreservationLab();
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
      <hr id="specimen-preservation-lab"></hr>
      <h3>▽ Specimen Preservation Lab Collectibles</h3>
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

export default SpecimenPreservationLab
