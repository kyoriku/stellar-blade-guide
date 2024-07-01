import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getFloodedCommercialSector } from '../../../utils/API/eidos7';

const FloodedCommercialSector = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFloodedCommercialSectorCollectibles();
  }, []);

  const fetchFloodedCommercialSectorCollectibles = async () => {
    try {
      const data = await getFloodedCommercialSector();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <hr id="flooded-commercial-sector"></hr>
      <h3>▽ Flooded Commercial Sector Collectibles</h3>
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

export default FloodedCommercialSector;
