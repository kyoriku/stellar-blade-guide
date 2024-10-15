import CollectiblesSection from "../../../components/CollectiblesSection";

const CapsuleClusterRoom = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Once you enter the Capsule Cluster Room, you'll see the crate on one of the platforms to the left. You can jump across the floating platforms to get over to it.",
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Directly after you leave the Capsule Cluster Room.",
    },
    {
      id: 3,
      title: "Legion Camp",
      text: "After unlocking the next gate from the previous camp, there will be another camp at the top of the stairs.",
    },
  ];

  return (
    <CollectiblesSection
      id="capsule-cluster-room"
      title="Capsule Cluster Room"
      level="Abyss-Levoire"
      location="Capsule-Cluster-Room"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default CapsuleClusterRoom
