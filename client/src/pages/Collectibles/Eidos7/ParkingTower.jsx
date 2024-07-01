import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getParkingTower } from '../../../utils/API/eidos7';

const ParkingTower = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchParkingTowerCollectibles();
  }, []);

  const fetchParkingTowerCollectibles = async () => {
    try {
      const data = await getParkingTower();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // if (isLoading) {
  //   return <div></div>;
  // }

  return (
    <div>
      <hr id="parking-tower"></hr>
      <h3>▽ Parking Tower Collectibles</h3>
      <hr className='w-75'></hr>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        content.map((item, index) => (
          <MediaDisplay
            key={item.id}
            title={item.title}
            text={item.text}
            images={item.images}
            showHr={index !== content.length - 1}
          />
        ))
      )}
    </div>
  );
}
      {/* {content.map((item, index) => (
        <MediaDisplay
          key={item.id}
          title={item.title}
          text={item.text}
          images={item.images}
          showHr={index !== content.length - 1}
        />
      ))}
    </div>
  );
} */}

export default ParkingTower;
