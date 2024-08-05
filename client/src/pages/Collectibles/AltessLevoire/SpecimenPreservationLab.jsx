import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getSpecimenPreservationLab } from '../../../utils/API/altessLevoire';

const SpecimenPreservationLab = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Chest",
      text: "Up the ladder as you enter, and then head to the right and open the door on your right. Watch out for the 2 Infectors inside.",
    },
    {
      id: 2,
      title: "Document - Announcements - Visitor Information",
      text: "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "When you head back towards the ladder (clockwise), a door that was previously closed is now open. There's a box inside.",
    },
    {
      id: 4,
      title: "Robot - Document - Promotions - Eidos Company Promotion",
      text: "In the far left room (as if you were facing the way you came in), there's a robot in there now.",
    }
  ];

  useEffect(() => {
    fetchSpecimenPreservationLabCollectibles();
  }, []);

  const fetchSpecimenPreservationLabCollectibles = async () => {
    try {
      const data = await getSpecimenPreservationLab();
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
      <Header id="specimen-preservation-lab" title="▽ Specimen Preservation LAb Collectibles" />
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

export default SpecimenPreservationLab
