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
      location: "Flooded Commercial Sector",
      title: "Drone Appearance - Armoured Pack",
      text: "Before heading up and over the bridge to the otherside of the abyss, from the camp head west and down. Use the poles to cross the gap and you'll come to an area with a Barnacle. Defeat it, and in a small enclosure to the southwest is this skin)."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Drone Apperance - Lop Bunny Pack",
      text: "Climb the pillar in the northeast and in the pipe you'll find this drone pack.",
    },
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
              <SkeletonLoader />
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
