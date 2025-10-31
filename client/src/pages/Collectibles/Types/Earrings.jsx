import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { getCollectiblesByType } from '../../../utils/API/collectibles';
import { Gem } from 'lucide-react';

const CollectiblesByType = () => {
  const { type } = useParams();
  const [collectibles, setCollectibles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollectibles = async () => {
      try {
        const data = await getCollectiblesByType(type);
        setCollectibles(data);
      } catch (err) {
        console.error('Failed to fetch collectibles of type', type, err);
        setError('Failed to fetch collectibles. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (type) {
      fetchCollectibles();
    } else {
      setError('No type provided');
      setIsLoading(false);
    }
  }, [type]);

  const staticContent = [
    {
      id: 1,
      level: "Eidos 7",
      location: "Construction Zone",
      title: "Earrings - Crimson Tear",
      text: "Turn around and use the yellow ledges to climb up to the next floor. The earrings are in the back of the room."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Earrings - Hanging Memory",
      text: "Return to where you fought the Gigas when you have the “Generous Drop Pod” Request."
    },
    {
      id: 3,
      level: "Matrix 11",
      location: "Closed Off Platform",
      title: "Earrings - Blue Point",
      text: "Before going up the ladder over the train carriage (which you can actually wander through the doors of too), go into the train carriage. There's a crate down the east end."
    },
    {
      id: 4,
      level: "Spire 4",
      location: "Prestige Lounge",
      title: "Earrings - Silver Tooth",
      text: "After reaching the lounge-like area, there will be a crate by the couches."
    }
  ];  

  const formatTypeForTitle = (type) => {
    return type
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase());  // Capitalize the first letter of each word
  };

  const formattedTypeTitle = formatTypeForTitle(type || '');

  return (
    <section>
      <Header id={type} title={
        <>
          <Gem className="inline-block align-text-bottom mr-1 me-1 text-info" size={32} />
          {formattedTypeTitle}
        </>
      } />
      <ErrorMessage message={error} />
      <div>
        {staticContent.map((contentItem, index) => (
          <article key={contentItem.id}>
            <p className="mb-1">
              <strong>Location:</strong> {contentItem.level} - {contentItem.location}
            </p>
            <ContentText
              title={contentItem.title}
              text={contentItem.text}
            />
            {isLoading ? (
              <SkeletonLoader variant="large" />
            ) : (
              collectibles[index] && (
                <MediaDisplay
                  images={collectibles[index].images}
                  addBottomMargin={false}
                />
              )
            )}
            <hr />
          </article>
        ))}
      </div>
    </section>
  );
};

export default CollectiblesByType;
