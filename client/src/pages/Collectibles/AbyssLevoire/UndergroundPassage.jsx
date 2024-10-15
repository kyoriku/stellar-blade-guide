import CollectiblesSection from "../../../components/CollectiblesSection";

const UndergroundPassage = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Log Data - Attack Detected",
      text: "From the previous camp, go into the next room and jump into the control room through the window. The document is on the floor near the blocked stairs.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "In the room directly after the long hallway where you have to fight waves of enemies",
    },
    {
      id: 3,
      title: "Locked Supply Chest",
      text: "After turning off the lasers, go across to the other side of the room and before going through the door, climb up the elevator shaft on the right. There will be a crate at the top where you'll need to do another arrow direction puzzle to open it.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Once you enter the overgrown hallway, keep going forward and then there will be a crate on the left end of the hallway.",
    },
    {
      id: 5,
      title: "Legion Camp",
      text: "On the opposite side from the supply box, through the door.",
    }
  ];

  return (
    <CollectiblesSection
      id="underground-passage"
      title="Underground Passage"
      level="Abyss-Levoire"
      location="Underground-Passage"
      staticContent={staticContent}
    />
  );
};

export default UndergroundPassage
