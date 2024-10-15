import CollectiblesSection from "../../../components/CollectiblesSection";

const Crater = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Legionnaire 274's Memory",
      text: "By a rock as soon as you enter the Crater area (near the small bit of water).",
    },
    {
      id: 2,
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss.",
    }
  ];

  return (
    <CollectiblesSection
      id="crater"
      title="Crater"
      level="Eidos-7"
      location="Crater"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default Crater;
