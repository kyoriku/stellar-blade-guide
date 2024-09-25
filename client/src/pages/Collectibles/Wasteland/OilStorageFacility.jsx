import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'oilStorageFacilityData';

const OilStorageFacility = () => {
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

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Wasteland",
    "Oil-Storage-Facility"
  );

  return (
    <section>
      <Header id="oil-storage-facility" title="▽ Oil Storage Facility Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default OilStorageFacility;
