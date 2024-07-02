import React, { useEffect, useState } from "react";
import MediaDisplay from "./MediaDisplay";
import LoadingSpinner from './LoadingSpinner';

const Collectibles = ({ fetchCollectibles, title, id, renderItem }) => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchCollectibles();
        setContent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchCollectibles]);

  return (
    <div>
      <hr id={id}></hr>
      <h3>▽ {title} Collectibles</h3>
      <hr className='w-75'></hr>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        content.map((item, index) => (
          renderItem ? renderItem(item, index, content) : (
            <MediaDisplay
              key={item.id}
              title={item.title}
              text={item.text}
              images={item.images}
              showHr={index !== content.length - 1 || item.text}
            />
          )
        ))
      )}
    </div>
  );
}

export default Collectibles;
