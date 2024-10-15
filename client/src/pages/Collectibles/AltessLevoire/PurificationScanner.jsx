import CollectiblesSection from "../../../components/CollectiblesSection";

const PurificationScanner = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Booting Sequence",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor.",
    },
  ];

  return (
    <CollectiblesSection
      id="purification-scanner"
      title="Purification Scanner"
      level="Altess-Levoire"
      location="Purification-Scanner"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default PurificationScanner;
