import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { getCollectiblesByType } from '../../../utils/API/collectibles';

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
      location: "Parking Tower",
      title: "Body Core",
      text: "In the Parking Tower, underneath the first set of stairs up."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Body Core",
      text: "Head north from the previous two collectibles (towards Gate 6) and then head down the stairs to an underground area, before heading up the stairs straight ahead. At the far end of that area (north), near two explosive barrels and a Cosnia Kolzen sign is another human and another Body Core."
    },
    {
      id: 3,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Body Core",
      text: "Head southwest out of the Parking Tower and follow the alley around, on the corner is a small bar/pub with lights on inside. The Body Core is on a body inside the shop."
    },
    {
      id: 4,
      level: "Eidos 7",
      location: "Construction Zone",
      title: "Body Core",
      text: "Get back on the beam and jump into the other building. The Body Core is on the floor there."
    },
    {
      id: 5,
      level: "Eidos 7",
      location: "City Underground",
      title: "Body Core",
      text: "Head outside from the previous human corpse and you'll find another human with a Body Core."
    },
    {
      id: 6,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Body Core",
      text: "Next to the previous memorystick."
    },
    {
      id: 7,
      level: "Wasteland",
      location: "Oil Storage Facility",
      title: "Body Core",
      text: "Right at the northside of the oil storage facility, inside a shipping container."
    },
    {
      id: 8,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Body Core",
      text: "As the path bends west, go east and destroy the crates. There's a corpse with a Body Core hidden by said crates."
    },
    {
      id: 9,
      level: "Matrix 11",
      location: "Landfill",
      title: "Body Core",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it."
    },
    {
      id: 10,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Body Core",
      text: "On the walkway of the area the last two collectibles were in, in the northeast corner."
    },
    {
      id: 11,
      level: "Matrix 11",
      location: "Train Graveyard",
      title: "Body Core",
      text: "To the northwest of the previous carriage is a platform above the water. There is a body with a Body Core on top. Use the wooden planks to jump over to it."
    },
    {
      id: 12,
      level: "Matrix 11",
      location: "Train Graveyard",
      title: "Body Core",
      text: "Above the Supply Camp, and beneath the door to the boss fight."
    },
    {
      id: 13,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Body Core",
      text: "Back on the supply camp ledge, look to the South and you will see some ledges you can jump to. Jump across to the ledge and continue around to find the Body Core."
    },
    {
      id: 14,
      level: "Great Desert",
      location: "Collapsed Overpass",
      title: "Body Core",
      text: "From the supply camp, head east into the ruins and there's a body and a Body Core inside one of the westernmost buildings."
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
      <Header id={type} title={`▽ ${formattedTypeTitle}`} />
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
