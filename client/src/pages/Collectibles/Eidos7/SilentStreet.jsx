import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getSilentStreet } from '../../../utils/API/eidos7';

const SilentStreet = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSilentStreetCollectibles();
  }, []);

  const fetchSilentStreetCollectibles = async () => {
    try {
      const data = await getSilentStreet();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <div>
      <hr id="silent-street"></hr>
      <h3>▽ Silent Street Collectibles</h3>
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

export default SilentStreet;
