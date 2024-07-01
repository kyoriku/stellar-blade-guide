import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getCityUnderground } from '../../../utils/API/eidos7';

const CityUnderground = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCityUndergroundCollectibles();
  }, []);

  const fetchCityUndergroundCollectibles = async () => {
    try {
      const data = await getCityUnderground();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <hr id="city-underground"></hr>
      <h3>▽ City Underground Collectibles</h3>
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

export default CityUnderground;
