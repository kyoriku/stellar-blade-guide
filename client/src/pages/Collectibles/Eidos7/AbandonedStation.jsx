import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getAbandonedStation } from '../../../utils/API/eidos7';

const AbandonedStation= () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAbandonedStationCollectibles();
  }, []);

  const fetchAbandonedStationCollectibles = async () => {
    try {
      const data = await getAbandonedStation();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <hr id="abandoned-station"></hr>
      <h3>▽ Abandoned Station Collectibles</h3>
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

export default AbandonedStation;
