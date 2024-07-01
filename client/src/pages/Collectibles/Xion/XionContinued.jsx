import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getXionContinued } from '../../../utils/API/xion';
import LoadingSpinner from '../../../components/LoadingSpinner';

const XionContinued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchXionContinuedCollectibles();
  }, []);

  const fetchXionContinuedCollectibles = async () => {
    try {
      const data = await getXionContinued();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <hr id="xion-continued"></hr>
      <h3>▽ Xion Collectibles (Continued)</h3>
      <p><i>The next set of collectibles won’t be available on your first time through the area, and require a side quest/progressing the story to access them.</i></p>
      <hr className="w-75"></hr>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        content.map((item, index) => {
          const isLastList = index === content.length - 1 || !Array.isArray(content[index + 1].text);

          return (
            <MediaDisplay
              key={item.id}
              title={item.title}
              text={item.text}
              images={item.images}
              showHr={!Array.isArray(item.text) || isLastList}
            />
          );
        })
      )}
    </div>
  );
};

export default XionContinued;
