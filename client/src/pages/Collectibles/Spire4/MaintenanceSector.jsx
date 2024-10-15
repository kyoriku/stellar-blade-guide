import CollectiblesSection from "../../../components/CollectiblesSection";

const MaintenanceSector = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Once you reach the Maintenance Sector, you can reach the camp by going across the beams on the right end of the room.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "From the camp, go across the wall running section and follow the swing bars to the next floor. The crate will be to your right once you're on the next floor.",
    },
  ];

  return (
    <CollectiblesSection
      id="maintenance-sector"
      title="Maintenance Sector"
      level="Spire-4"
      location="Maintenance-Sector"
      staticContent={staticContent}
    />
  );
};

export default MaintenanceSector
