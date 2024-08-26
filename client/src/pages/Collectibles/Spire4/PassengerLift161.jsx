import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getPassengerLift161 } from '../../../utils/API/spire4';

const PassengerLift161 = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Once you enter the Passenger Elevator, the camp will be directly to your left.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Straight ahead, behind Arisa.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "After lifting the Code Red and going up to the second floor of the Passenger Elevator, there will be a crate on the right side.",
    },
    {
      id: 4,
      title: "Beta Core",
      text: "After going up the rope leading to the 4th floor, it'll be on a corpse near the bed.",
    },
  ];

  useEffect(() => {
    fetchPassengerLift161Collectibles();
  }, []);

  const fetchPassengerLift161Collectibles = async () => {
    try {
      const data = await getPassengerLift161();
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
      <Header id="passenger-lift-161" title="▽ Passenger Lift 161 Collectibles" />
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

export default PassengerLift161
