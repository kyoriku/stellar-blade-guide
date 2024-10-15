import CollectiblesSection from "../../../components/CollectiblesSection";

const SpecimenPreservationLab = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Chest",
      text: "Up the ladder as you enter, and then head to the right and open the door on your right. Watch out for the 2 Infectors inside.",
    },
    {
      id: 2,
      title: "Document - Announcements - Visitor Information",
      text: "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "When you head back towards the ladder (clockwise), a door that was previously closed is now open. There's a box inside.",
    },
    {
      id: 4,
      title: "Robot - Document - Promotions - Eidos Company Promotion",
      text: "In the far left room (as if you were facing the way you came in), there's a robot in there now.",
    }
  ];

  return (
    <CollectiblesSection
      id="specimen-preservation-lab"
      title="Specimen Preservation Lab"
      level="Altess-Levoire"
      location="Specimen-Preservation-Lab"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default SpecimenPreservationLab
