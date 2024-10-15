import CollectiblesSection from "../../../components/CollectiblesSection";

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

  return (
    <CollectiblesSection
      id="oil-storage-facility"
      title="Oil Storage Facility"
      level="Wasteland"
      location="Oil-Storage-Facility"
      staticContent={staticContent}
    />
  );
};

export default OilStorageFacility;
