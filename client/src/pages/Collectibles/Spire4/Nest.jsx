import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getNest } from '../../../utils/API/spire4';

const Nest = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "When back on earth, going to fight the Elder Naytiba, this camp is on the left after you see the message from Raven.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "In the nest on the right.",
    },
  ];

  useEffect(() => {
    fetchNestCollectibles();
  }, []);

  const fetchNestCollectibles = async () => {
    try {
      const data = await getNest();
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
      <Header id="nest" title="▽ Nest Collectibles" />
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
              <hr></hr>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Nest
