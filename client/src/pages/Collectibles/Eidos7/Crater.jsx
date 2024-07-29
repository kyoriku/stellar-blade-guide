import React, { useEffect, useState } from "react";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getCrater } from '../../../utils/API/eidos7';

const Crater = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Legionnaire 274's Memory",
      text: "By a rock as soon as you enter the Crater area (near the small bit of water).",
    },
    {
      id: 2,
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss.",
    }
  ];

  useEffect(() => {
    fetchCraterCollectibles();
  }, []);

  const fetchCraterCollectibles = async () => {
    try {
      const data = await getCrater();
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
      <hr id="crater"></hr>
      <h3>▽ Crater Collectibles</h3>
      <hr className='w-75'></hr>
      {error && <p className="error-message">{error}</p>}
      {staticContent.map((item, index) => (
        <div key={item.id}>
          <ContentText title={item.title} text={item.text} />
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
          )}
          <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
        </div>
      ))}
    </div>
  );
};

export default Crater;
