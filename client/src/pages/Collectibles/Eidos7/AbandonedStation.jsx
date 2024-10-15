import CollectiblesSection from "../../../components/CollectiblesSection";

const AbandonedStation = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Respite of the Hopeful / Passcode - δβμκδβ",
      text: "After entering the flooded facility, to the right of the first door (north wall) is a corpse underwater with both this memorystick and passcode.",
    },
    {
      id: 2,
      title: "Supply Camp - Abandoned Station",
      text: "Up the elevator shaft in the Abandoned Station.",
    },
    {
      id: 3,
      title: "Memorystick - Legionnaire 244's Memory",
      text: "As you get out of the monorail on the other side.",
    },
    {
      id: 4,
      title: "Nano Suit - Planet Diving Suit (7th) V2",
      text: "In the southwest corner, in a small room, in the tram station at the beginning of the level (before heading outside towards the objective).",
    },
  ];

  return (
    <CollectiblesSection
      id="abandoned-station"
      title="Abandoned Station"
      level="Eidos-7"
      location="Abandoned-Station"
      staticContent={staticContent}
      skeletonVariant="large"
    />
  );
};

export default AbandonedStation;
