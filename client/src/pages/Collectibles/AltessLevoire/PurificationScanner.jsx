import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getPurificationScanner } from '../../../utils/API/altessLevoire';
import { Skeleton } from "@mui/material";

const PurificationScanner = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Booting Sequence",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you.",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/1-PurificationScanner/2-Document - Log Data - Booting Sequence.jpg",
          alt: "Document - Log Data - Booting Sequence"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor.",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/1-PurificationScanner/3-Legion Camp.jpg",
          alt: "Legion Camp"
        }
      ]
    },
  ];

  useEffect(() => {
    fetchPurificationScannerCollectibles();
  }, []);

  const fetchPurificationScannerCollectibles = async () => {
    try {
      const data = await getPurificationScanner();
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
      <hr id="purification-scanner"></hr>
      <h3>▽ Purification Scanner Collectibles</h3>
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

export default PurificationScanner
