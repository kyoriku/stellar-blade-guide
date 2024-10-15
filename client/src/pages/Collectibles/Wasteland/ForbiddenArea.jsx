import CollectiblesSection from "../../../components/CollectiblesSection";

const ForbiddenArea = () => {
  const staticContent = [
    {
      id: 1,
      title: "Can - Cryo The Clear",
      text: "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the “Life of the Scavengers” side quest.",
    },
    {
      id: 2,
      title: "Memorystick - Tommy's Testament",
      text: "Interact with Tommy's body after defeating the Brute.",
    },
    {
      id: 3,
      title: "Nano Suit - Sporty Yellow",
      text: "In a chest where the Brute came from in the Forbidden Area. Directly behind Tommy's body.",
    }
  ];

  return (
    <CollectiblesSection
      id="forbidden-area"
      title="Forbidden Area"
      level="Wasteland"
      location="Forbidden-Area"
      staticContent={staticContent}
    />
  );
};

export default ForbiddenArea
