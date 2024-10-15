import CollectiblesSection from "../../../components/CollectiblesSection";

const ResearchLabEntrance = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - You Are Fake",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one.",
    },
  ];

  return (
    <CollectiblesSection
      id="research-lab-entrance"
      title="Research Lab Entrance"
      level="Altess-Levoire"
      location="Research-Lab-Entrance"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default ResearchLabEntrance;
