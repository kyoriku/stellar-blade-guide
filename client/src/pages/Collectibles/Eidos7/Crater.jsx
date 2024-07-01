import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getCrater } from '../../../utils/API/eidos7';

const Crater = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCraterCollectibles();
  }, []);

  const fetchCraterCollectibles = async () => {
    try {
      const data = await getCrater();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <hr id="crater"></hr>
      <h3>▽ Crater Collectibles</h3>
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

export default Crater;