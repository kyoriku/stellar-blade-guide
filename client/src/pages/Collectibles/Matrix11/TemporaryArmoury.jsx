import CollectiblesSection from "../../../components/CollectiblesSection";

const TemporaryArmoury = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Temporary Armoury Entrance",
      text: "At the bottom of the lift."
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Northwest corner of the boss fight arena (on the shipping crates, inside a shipping crate)."
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "In the eastern corner, behind a shipping crate. Contains 2 Omnibolts and Burst Enhancement Gear."
    },
    {
      id: 4,
      title: "Can - Newfoundland Dry",
      text: "In the southwest corner of the boss fight arena."
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "Next to the aforementioned can."
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "On the way out of the arena (up on the southern walkway)."
    },
    {
      id: 7,
      title: "Legion Camp",
      text: "As you leave the arena in the southeast corner."
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Slide down the lift shaft and there's a crate on a platform at the bottom. It contains an Omnibolt and Shield Destruction Gear (2 star)."
    }
  ];

  return (
    <CollectiblesSection
      id="temporary-armoury"
      title="Temporary Armoury"
      level="Matrix-11"
      location="Temporary-Armoury"
      staticContent={staticContent}
    />
  );
};

export default TemporaryArmoury;
