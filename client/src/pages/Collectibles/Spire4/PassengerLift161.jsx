import CollectiblesSection from "../../../components/CollectiblesSection";

const PassengerLift161 = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "Once you enter the Passenger Elevator, the camp will be directly to your left.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Straight ahead, behind Arisa.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "After lifting the Code Red and going up to the second floor of the Passenger Elevator, there will be a crate on the right side.",
    },
    {
      id: 4,
      title: "Beta Core",
      text: "After going up the rope leading to the 4th floor, it'll be on a corpse near the bed.",
    },
  ];

  return (
    <CollectiblesSection
      id="passenger-lift-161"
      title="Passenger Lift 161"
      level="Spire-4"
      location="Passenger-Lift-161"
      staticContent={staticContent}
    />
  );
};

export default PassengerLift161
