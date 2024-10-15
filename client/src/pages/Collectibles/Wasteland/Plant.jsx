import CollectiblesSection from "../../../components/CollectiblesSection";

const Plant = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Luke's Memory",
      text: "At the bottom of the water in the middle of the Plant.",
    },
    {
      id: 2,
      title: "Memorystick - Go's Memory",
      text: "Once you pick up the “Incarceration” side quest from the guy in the shipping container, you'll find another corpse in the water. This one with this memorystick.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Above the red lights in the middle of the water, on that platform.",
    },
    {
      id: 4,
      title: "Can - The Machinetta Cafe Latte",
      text: "Push all three storage trolleys on the pressure plates and this will drop from the crane.",
    }
  ];

  return (
    <CollectiblesSection
      id="plant"
      title="Plant"
      level="Wasteland"
      location="Plant"
      staticContent={staticContent}
    />
  );
};

export default Plant
