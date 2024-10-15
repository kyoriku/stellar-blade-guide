import CollectiblesSection from "../../../components/CollectiblesSection";

const SectorA07 = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Security Procedure Guide",
      text: "After the symbol floor puzzle, on the right before you go through the next door.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Through the door, on your left",
    }
  ];

  return (
    <CollectiblesSection
      id="sector-a07"
      title="Sector A07"
      level="Altess-Levoire"
      location="Sector-A07"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default SectorA07
