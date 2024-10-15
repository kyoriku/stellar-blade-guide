import CollectiblesSection from "../../../components/CollectiblesSection";

const BarrenLands = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Hidden Path",
      text: "As soon as you enter the area. However, you need to restore power at the Solar Tower to use it (side quest, “Reboot”).",
    },
    {
      id: 2,
      title: "Memorystick - Amanda's Memory",
      text: "From the supply camp, head southwest and there'll be a human corpse as the area opens up a little",
    },
    {
      id: 3,
      title: "Memorystick - Donna's Memory",
      text: "The corpse next to the previous memorystick is actually part of the “Missing Wife” Request. Interact to get this memorystick.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Just slightly southwest from the previous memorysticks.",
    },
    {
      id: 5,
      title: "Robot - Document - Series - The Xion #2",
      text: "East of the supply camp is a robot who drops this document.",
    },
    {
      id: 6,
      title: "Memorystick - Citizen 439's Resignation",
      text: "Southeast of the Hidden Path supply camp is a large dead tree with a human corpse at its base.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "East of the previous memorystick.",
    },
    {
      id: 8,
      title: "Memorystick - Sentinel 78's Consolation",
      text: "Just slightly southeast of the waypoint, behind a massive steel girder.",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "Not far south from the Waypoint (northeast of the Barren Land Legion Camp).",
    },
    {
      id: 10,
      title: "Legion Camp - Barren Land",
      text: "Southwest of the previous supply box is the Barren Land Legion Camp.",
    },
    {
      id: 11,
      title: "Memorystick - Scavenger 160's Advice",
      text: "Just northwest of the Barren Land Legion Camp is a Hedgeboar by two corpses.",
    },
    {
      id: 12,
      title: "Memorystick - Scavenger 102's Decision",
      text: "The other corpse is next to the previous Memorystick.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnaire 311's Resolution",
      text: "Slumped up against the west side of the Solar Tower.",
    },
    {
      id: 14,
      title: "Exospine - Camouflage-Type",
      text: "At the top of the Solar Tower, in the western area of the Wasteland.",
    },
    {
      id: 15,
      title: "Memorystick - Legionnaire 323's Warning",
      text: "West of the Solar Tower is a body, at the base of a billboard.",
    },
    {
      id: 16,
      title: "Can - Potential Tempest",
      text: "Turn on 2 consoles in the area north of the Solar Tower, then push the yellow box to the shipping container in the middle of the area to turn on the final console. The chest next to it will open, which has this can inside.",
    },
    {
      id: 17,
      title: "Memorystick - The Search for a Haven",
      text: "Head northeast of the Solar Tower and climb the cliffs up to the large open area to the northwest. There's a corpse at the entrance.",
    },
    {
      id: 18,
      title: "Lily Outfit - Rainy Day",
      text: "North of the previous memorystick, in the haven. Underwater. Ignore the other chest for now (the locked one), as that's part of another quest later on when you have the Fishing Rod.",
    },
    {
      id: 19,
      title: "Nano Suit - Racer's High",
      text: "Head back out from the haven, go east and drop down onto the rocks for this Nano Suit.",
    },
    {
      id: 20,
      title: "Supply Camp - Solar Tower Entrance",
      text: "You'll find this camp east of the Solar Tower.",
    },
    {
      id: 21,
      title: "Memorystick - Marco's Recollection",
      text: "Just to the northeast of the Supply Camp is a human corpse with this memorystick.",
    },
    {
      id: 22,
      title: "Robot - Mind Map Copy",
      text: "Southeast of the Barren Land Legion Camp is a robot with a Mind Map Copy inside. Part of Su and Enya's side quest, “Looking At You.”",
    },
    {
      id: 23,
      title: "Robot - Mind Map Copy",
      text: "East of the Hidden Path Supply Camp is a path that leads to a dead end. It's heavily guarded, and has a robot in the middle. Part of Su and Enya's side quest, “Looking At You.”",
    },
    {
      id: 24,
      title: "Exospine - Impact-Type",
      text: "Defeat the three waves of enemies in the small arena to the north of the Robot and you'll find this in the case at the end.",
    },
    {
      id: 25,
      title: "Memorystick - Scavenger 248's Despair",
      text: "South of the previous area. On the cliffs to the west.",
    },
    {
      id: 26,
      title: "Legion Supply Box",
      text: "East of the previous memorystick. At the end of a small dead end.",
    },
    {
      id: 27,
      title: "Memorystick - Sentinel 82's Report",
      text: "South of the previous supply crate, just jump down the cliff and it's by an enemy or two.",
    },
    {
      id: 28,
      title: "Memorystick - Scavenger 131's Memory",
      text: "South of the previous memorystick, in the southeast corner of the dead end area.",
    },
    {
      id: 29,
      title: "Can - GrainT Corn",
      text: "On the eastern path from the previous items (the path that leads to Altess Levoire)",
    },
  ];

  return (
    <CollectiblesSection
      id="barren-lands"
      title="Barren Lands"
      level="Wasteland"
      location="Barren-Lands"
      staticContent={staticContent}
    />
  );
};

export default BarrenLands;
