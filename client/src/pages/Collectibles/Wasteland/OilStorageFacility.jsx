import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getOilStorageFacility } from "../../../utils/API/wasteland";

const OilStorageFacility = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Lee's Complaint",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 2,
      title: "Memorystick - Woo's Record",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 3,
      title: "Memorystick - Young's Screams",
      text: "This is part of the “Urgent Information” side quest.",
    },
    {
      id: 4,
      title: "Body Core",
      text: "Right at the northside of the oil storage facility, inside a shipping container.",
    },
  ];

  useEffect(() => {
    fetchOilStorageFacilityCollectibles();
  }, []);

  const fetchOilStorageFacilityCollectibles = async () => {
    try {
      const data = await getOilStorageFacility();
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
      <Header id="oil-storage-facility" title="▽ Oil Storage Facility Collectibles" />
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

export default OilStorageFacility;
