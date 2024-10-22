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
      location: "Silent Street",
      title: "Beta Core",
      text: "After the ambush with the Mutated Creeper, Creepers and finally the Heavy Guardian, head down the alley to the north-northeast corner and follow it round to the left. There, near a Guardian, is the Beta Core (needed to upgrade your max beta energy)."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Beta Core",
      text: "Further north, near the northernmost chainlink fence is a corpse with this Beta Core."
    },
    {
      id: 3,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Beta Core",
      text: "In the same area as the drone skin, on the northside, is a corpse with this beta core."
    },
    {
      id: 4,
      level: "Eidos 7",
      location: "Memory Tower",
      title: "Beta Core",
      text: "In Northeast corner of the Corrupter battle area there's an alleyway. Head down it slightly (just down the stairs), and to the right is a corpse with this Beta Core on it. Inside The Red Grill (with flashing neon 'closed' sign)."
    },
    {
      id: 5,
      level: "Eidos 7",
      location: "City Underground",
      title: "Beta Core",
      text: "After climbing up to the top (after the pipe section), instead of going north and down the hole, head northeast and down that hole. There's a human dead body there with this core on it."
    },
    {
      id: 6,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Beta Core",
      text: "Head east from the last lot of collectibles to the building by the scrap piles. In the middle of the scrap piles is a human corpse with this Beta Core."
    },
    {
      id: 7,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Beta Core",
      text: "Keep climbing to the top (above the Waypoint), and there's a body with a Beta Core on the edge."
    },
    {
      id: 8,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Beta Core",
      text: "Just to the right of the can is a human body with this Beta Core in it."
    },
    {
      id: 9,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Beta Core",
      text: "Northwest of the Junkyard Supply Camp is a wallrunning section that you need to Double Jump for. Head back there and follow the path to the end for this Beta Core."
    },
    {
      id: 10,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Beta Core",
      text: "After observing the view from the bridge, in the next area, inside the carriage on the left, you'll find a Beta Core."
    },
    {
      id: 11,
      level: "Matrix 11",
      location: "Underground Sewer",
      title: "Beta Core",
      text: "Again, before heading the correct way, while in the central chamber, dive down and head into the northeast corner. When you're in the corner, swim to the surface and there you'll find a Beta Core."
    },
    {
      id: 12,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Beta Core",
      text: "In the north-northeast corner of the same room. Climb the ladder (where you will eventually put in the Fusion Cell) and then turn around. In that room straight ahead, down the bottom, is a Beta Core."
    },
    {
      id: 13,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Beta Core",
      text: "In the same area, just in a different offshoot of a tunnel (southern one)."
    },
    {
      id: 14,
      level: "Great Desert",
      location: "Collapsed Overpass",
      title: "Beta Core",
      text: "Use the yellow box in that area to climb the wall. On the other side, to the north, near a car, is a body with a Beta Core."
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
        <ErrorMessage message={error} />
      </div>
    </section>
  );
};

export default CollectiblesByType;
