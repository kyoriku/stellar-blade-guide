import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { getAtelier } from '../../../utils/API/eidos9';

const Atelier = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "After going down the red slide and reaching the floating cargo containers, right before jumping onto the main island, you can jump to the half-submerged cargo container. You'll land in the water and have to swim a little bit to the cargo container, but you shouldn't die depending on how far you managed to jump. From here, jump towards the smaller island, where there will be a crate behind the rubble.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Once you reach the Atelier, the camp will be on the pathway around to the entrance.",
    },
    {
      id: 3,
      title: "Document - Messages - What Will You Choose",
      text: "On the ground inside the Atelier.",
    },
  ];


  useEffect(() => {
    fetchAtelierCollectibles();
  }, []);

  const fetchAtelierCollectibles = async () => {
    try {
      const data = await getAtelier();
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
      <Header id="atelier" title="▽ Atelier Collectibles" />
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

export default Atelier
