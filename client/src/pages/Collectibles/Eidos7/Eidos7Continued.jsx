import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import LoadingSpinner from '../../../components/LoadingSpinner';
import { getEidos7Continued } from '../../../utils/API/eidos7';

const Eidos7Continued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEidos7ContinuedCollectibles();
  }, []);

  const fetchEidos7ContinuedCollectibles = async () => {
    try {
      const data = await getEidos7Continued();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <hr id="eidos-7-continued"></hr>
      <h3>▽ Eidos 7 Collectibles (Continued)</h3>
      <p><i>The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them.</i></p>
      <hr className="w-75"></hr>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        content.map((item) => (
          <MediaDisplay
            key={item.id}
            title={item.title}
            text={item.text}
            images={item.images}
            showHr={item.text}
          />
        ))
      )}
    </div>
  );
}

export default Eidos7Continued;