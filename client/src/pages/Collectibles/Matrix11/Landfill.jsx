import CollectiblesSection from "../../../components/CollectiblesSection";

const Landfill = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "On the opposite side of the upper terrace as you reach the landfill area.",
    },
    {
      id: 2,
      title: "Memorystick - Employee 33's Determination",
      text: "Head down the lift and downstairs, where the Mites are, is a body with this memorystick.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "On the left-hand side of the actual landfill, up a level from the garbage and the enemies.",
    },
    {
      id: 4,
      title: "Locked Supply Chest",
      text: "In the middle of the landfill area. Passcode is from the body before (αγδμθδ). Also contains the Fusion Cell.",
    },
    {
      id: 5,
      title: "Memorystick - Legionnaire 507's Regret",
      text: "As you come out of the landfill (after using the Fusion Cell), on the right, on the train tracks.",
    },
    {
      id: 6,
      title: "Body Core",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it.",
    },
    {
      id: 7,
      title: "Legion Camp",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it.",
    },
  ];

  return (
    <CollectiblesSection
      id="landfill"
      title="Landfill"
      level="Matrix-11"
      location="Landfill"
      staticContent={staticContent}
    />
  );
};

export default Landfill;
