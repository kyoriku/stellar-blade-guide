import React, { useEffect, useState } from "react";
import MediaDisplay from "./MediaDisplay";
import { Skeleton } from "@mui/material";
import '../styles/Collectibles.css';

const Collectibles = ({ fetchCollectibles, title, id, renderItem }) => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
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

  if (isLoading) {
    return (
      <div>
        <hr id={id}></hr>
        <h3>▽ {title} Collectibles</h3>
        <hr className='w-75'></hr>
        {isLoading && (
          <div>
            {[...Array(5)].map((_, index) => (
              <div key={index}>
                <Skeleton animation="wave" height={20} width="90%" className="skeleton-title" />
                <Skeleton animation="wave" height={20} width="60%" className="skeleton-subtitle" />
                <div className="skeleton-container">
                  <Skeleton animation="wave" height={212} width={376} variant="rounded" className="skeleton-item" />
                  <Skeleton animation="wave" height={212} width={376} variant="rounded" className="skeleton-item" />
                </div>
                <hr></hr>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <hr id={id}></hr>
      <h3>▽ {title} Collectibles</h3>
      <hr className='w-75'></hr>
      {content.map((item, index) => (
        renderItem ? renderItem(item, index, content) : (
          <MediaDisplay
            key={item.id}
            title={item.title}
            text={item.text}
            images={item.images}
            showHr={index !== content.length - 1 || item.text}
          />
        )
      ))}
    </div>
  );
}

export default Collectibles;