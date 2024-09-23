import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { getBetaCores } from '../../../utils/API/collectibleTypes';

const BetaCores = () => {
  const { type } = useParams();
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollectibles = async () => {
      try {
        const data = await getBetaCores(type);
        setContent(data);
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

  const formatTypeForTitle = (type) => {
    return type
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase());  // Capitalize the first letter of each word
  };

  const formattedTypeTitle = formatTypeForTitle(type || '');

  return (
    <section>
      <Header id={type} title={`▽ All ${formattedTypeTitle}`} />
      <ErrorMessage message={error} />
      <div>
        {isLoading ? (
          <SkeletonLoader variant="large" />
        ) : (
          content.length ? (
            content.map((collectible) => (
              <article key={collectible._id} >
                <p className="mb-1"><strong>Location:</strong> {collectible.level} - {collectible.location}</p>
                <ContentText
                  title={collectible.title}
                  text={collectible.text}
                />
                <MediaDisplay
                  images={collectible.images}
                  addBottomMargin={false}
                />
                <hr />
              </article>
            ))
          ) : (
            <p>No collectibles found for this type.</p>
          )
        )}
        <ErrorMessage message={error} />
      </div>
    </section>
  );
};

export default BetaCores;
