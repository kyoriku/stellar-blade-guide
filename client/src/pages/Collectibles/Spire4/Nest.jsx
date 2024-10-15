import CollectiblesSection from "../../../components/CollectiblesSection";

const Nest = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "When back on earth, going to fight the Elder Naytiba, this camp is on the left after you see the message from Raven.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "In the nest on the right.",
    },
  ];

  return (
    <CollectiblesSection
      id="nest"
      title="Nest"
      level="Spire-4"
      location="Nest"
      staticContent={staticContent}
      alwaysShowFinalHr={true}
    />
  );
};

export default Nest
