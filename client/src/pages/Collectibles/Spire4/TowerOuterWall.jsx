import CollectiblesSection from "../../../components/CollectiblesSection";

const TowerOuterWall = () => {
  const staticContent = [
    {
      id: 1,
      title: "Robot - Drone Upgrade Module",
      text: "Once you're outside going across the beams, jump across to another beam and follow it to the end. Once you're at the end, climb up the yellow ledges to find a robot that will drop the Drone Upgrade Module.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Once you're back inside the building, drop down and there will be a crate underneath you.",
    },
    {
      id: 3,
      title: "Can - Moonwell",
      text: "From the previous crate, after defeating the Machine Hive, you can jump around the wall to the right and there will be a vending machine at the end with the can inside. If you miss this one, you can fish it up from the Oasis in the Great Desert using Strange Bait after finishing Spire 4",
    },
  ];

  return (
    <CollectiblesSection
      id="tower-outer-wall"
      title="Tower Outer Wall"
      level="Spire-4"
      location="Tower-Outer-Wall"
      staticContent={staticContent}
    />
  );
};

export default TowerOuterWall
