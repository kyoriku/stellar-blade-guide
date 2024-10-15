import CollectiblesSection from "../../../components/CollectiblesSection";

const VermillionGarden = () => {
  const staticContent = [
    {
      id: 1,
      title: "Nano Suit - Photogenic",
      text: "After leaving the boss fight arena, this crate is in the next room, straight ahead of you.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "There's a supply box beside the crate with the Nano Suit.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Inside the elevator shaft, take the first moving yellow ledge and jump off to the right to find the crate. Contains 2 Omnibolts and Risk Taking Gear (3 star)",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "After taking the third moving yellow ledge, the next crate will be on the left side.",
    },
  ];

  return (
    <CollectiblesSection
      id="vermillion-garden"
      title="Vermillion Garden"
      level="Spire-4"
      location="Vermillion-Garden"
      staticContent={staticContent}
    />
  );
};

export default VermillionGarden
