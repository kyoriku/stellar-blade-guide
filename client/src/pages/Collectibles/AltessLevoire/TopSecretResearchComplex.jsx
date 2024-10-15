import CollectiblesSection from "../../../components/CollectiblesSection";

const TopSecretResearchComplex = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right.",
    },
  ];

  return (
    <CollectiblesSection
      id="top-secret-research-complex"
      title="Top Secret Research Complex"
      level="Altess-Levoire"
      location="Top-Secret-Research-Complex"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default TopSecretResearchComplex
