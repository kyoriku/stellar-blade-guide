import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getPrestigeLounge } from '../../../utils/API/spire4';

const PrestigeLounge = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Earrings - Silver Tooth",
      text: "After reaching the lounge-like area, there will be a crate by the couches.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "Automatically activated during a cutscene after going through the door in the lounge.",
    },
  ];

  useEffect(() => {
    fetchPrestigeLoungeCollectibles();
  }, []);

  const fetchPrestigeLoungeCollectibles = async () => {
    try {
      const data = await getPrestigeLounge();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header id="prestige-lounge" title="▽ Prestige Lounge Collectibles" />
      <ErrorMessage message={error} />
      {!error && (
        <div>
          {staticContent.map((item, index) => (
            <article key={item.id}>
              <ContentText title={item.title} text={item.text} />
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
              )}
              <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default PrestigeLounge
