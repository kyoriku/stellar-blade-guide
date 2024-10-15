import CollectiblesSection from "../../../components/CollectiblesSection";

const EmergencyExit = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp",
      text: "As you enter through the first door, you'll come across the first supply camp.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "At the end of the saw blade section.",
    },
    {
      id: 3,
      title: "Document - Journal - Kill Mother Sphere",
      text: "Once the saw blades have stopped and the fans are off, there is a document near the yellow cube on the left hand side of the room, opposite the legion camp",
    },
  ];

  return (
    <CollectiblesSection
      id="emergency-exit"
      title="Emergency Exit"
      level="Abyss-Levoire"
      location="Emergency-Exit"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default EmergencyExit
