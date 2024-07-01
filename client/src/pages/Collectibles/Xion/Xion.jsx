import React, { useEffect, useState } from "react";
import MediaDisplay from "../../../components/MediaDisplay";
import { getXion } from '../../../utils/API/xion';
import LoadingSpinner from '../../../components/LoadingSpinner';

const Xion = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchXionCollectibles();
  }, []);
  
  const fetchXionCollectibles = async () => {
    try {
      const data = await getXion();
      setContent(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <hr className="divider" id="xion" />
      <h3>▽ Xion Collectibles</h3>
      <hr className="w-75" />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        content.map((item, index) => {
          const isLastItem = index === content.length - 1;
          const isNextTextArray = !isLastItem && Array.isArray(content[index + 1].text);
          const showHr = !isLastItem && (!Array.isArray(item.text) || !isNextTextArray);
          const addBottomMargin = item.id === 24;
  
          return (
            <MediaDisplay
              key={item.id}
              title={item.title}
              text={item.text}
              images={item.images}
              showHr={showHr}
              addBottomMargin={addBottomMargin}
            />
          );
        })
      )}
    </div>
  );
  
};

export default Xion;
