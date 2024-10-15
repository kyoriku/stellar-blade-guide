import CollectiblesSection from "../../../components/CollectiblesSection";

const SecurityCenter = () => {
  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - Humanity Liberation Front",
      text: "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right.",
    },
    {
      id: 2,
      title: "Legion Supply Chest",
      text: "By the door you just opened. Can't miss it.",
    }
  ];

  return (
    <CollectiblesSection
      id="security-center"
      title="Security Center"
      level="Altess-Levoire"
      location="Security-Center"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default SecurityCenter
