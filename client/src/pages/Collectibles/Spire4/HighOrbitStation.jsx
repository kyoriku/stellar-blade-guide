import CollectiblesSection from "../../../components/CollectiblesSection";

const HighOrbitStation = () => {
  const staticContent = [
    {
      id: 1,
      title: "Beta Core",
      text: "As soon as you reach the top of the elevator shaft, instantly turn to the left to find a corpse with the Beta Core.",
    },
    {
      id: 2,
      title: "Supply Camp",
      text: "There's a supply camp on the right side of the same room as the Beta Core.",
    },
  ];

  return (
    <CollectiblesSection
      id="high-orbit-station"
      title="High Orbit Station"
      level="Spire-4"
      location="High-Orbit-Station"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default HighOrbitStation
