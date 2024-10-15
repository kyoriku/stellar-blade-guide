import CollectiblesSection from "../../../components/CollectiblesSection";

const PrestigeLounge = () => {
  const staticContent = [
    {
      id: 1,
      title: "Earrings - Silver Tooth",
      text: "After reaching the lounge-like area, there will be a crate by the couches.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "Automatically activated during a cutscene after going through the door in the lounge.",
    },
  ];

  return (
    <CollectiblesSection
      id="prestige-lounge"
      title="Prestige Lounge"
      level="Spire-4"
      location="Prestige-Lounge"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default PrestigeLounge
