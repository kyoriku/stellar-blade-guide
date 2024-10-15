import CollectiblesSection from "../../../components/CollectiblesSection";

const ClosedLobby = () => {
  const staticContent = [
    {
      id: 1,
      title: "Nano Suit - Planet Diving Suit (3rd)",
      text: "Instead of heading to the right and going to the yellow box, there's an offshoot in the right-hand corridor to the right. Head in there, defeat all the enemies, while avoiding all the lasers, and this Nano Suit is all yours.",
    },
    {
      id: 2,
      title: "Document - Log Data - Cultivation Experiment",
      text: "In the room with both control booths, the one in the right-hand corner has a PC on in the corner. Interact with it for this document.",
    },
  ];

  return (
    <CollectiblesSection
      id="closed-lobby"
      title="Closed Lobby"
      level="Abyss-Levoire"
      location="Closed-Lobby"
      staticContent={staticContent}
    />
  );
};

export default ClosedLobby
