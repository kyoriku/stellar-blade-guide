import CollectiblesSection from "../../../components/CollectiblesSection";

const CollapsedRailBridge = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "As soon as you step onto the bridge, there will be a staircase on the right. Go down the stairs and you will find the Legion Supply Box.",
    },
    {
      id: 2,
      title: "Robot - Drone Upgrade Modules",
      text: "Follow the collapsed bridge to the end, and there's a robot in that area with 2 Skull enemies.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Turn around from the robot and climb the stairs to find a supply box. Contains an Omnibolt and Critical Enhancement Gear.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Up top, after the QTE train sequence, on the main road.",
    },
    {
      id: 5,
      title: "Supply Camp - Twisted Iron Bridge",
      text: "At the end of the tunnel upstairs.",
    },
    {
      id: 6,
      title: "Adam Outfit - Chameleon",
      text: "In the next broken bridge area, after going through the Hive infested train carriage, on the right-hand side of the next carriage.",
    },
    {
      id: 7,
      title: "Locked Supply Chest",
      text: "In the next area where 3 Skull enemies are.",
    },
    {
      id: 8,
      title: "Beta Core",
      text: "After observing the view from the bridge, in the next area, inside the carriage on the left, you'll find a Beta Core.",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "At the end of the platform level, before going down the ladder.",
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "At the bottom of the ladder, under the stairs to the right.",
    },
    {
      id: 11,
      title: "Memorystick - Alex's Memory",
      text: "In the next area after going down the ladder, at the end of the corridor down low.",
    },
    {
      id: 12,
      title: "Legion Supply Box",
      text: "Do a 180 from the last collectible, and look to the southeast.",
    },
    {
      id: 13,
      title: "Body Core",
      text: "On the walkway of the area the last two collectibles were in, in the northeast corner.",
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "In the next area, in the northeast corner, behind a Hive monster. It contains an Omnibolt and Speed Increase Gear (2 star).",
    },
    {
      id: 15,
      title: "Memorystick - Robert's Last Farewell",
      text: "Above the previous chest, up the stairs, against the wall.",
    },
    {
      id: 16,
      title: "Legion Camp",
      text: "At the end of this area is a Legion Camp which Adam will say you should rest at.",
    },
    {
      id: 17,
      title: "Legion Supply Box",
      text: "After climbing the carriage up, do a 180 and look behind it.",
    },
    {
      id: 18,
      title: "Can - Cryo Cafe Vanilla",
      text: "In the southwest corner of the Rail Yard where you fight the Stalker, on the platform along the edge.",
    },
    {
      id: 19,
      title: "Robot - Tumbler Expansion Module",
      text: "Just up a level to the north from the previous can.",
    },
    {
      id: 20,
      title: "Supply Camp - Rail Yard",
      text: " Using N72R5 to open the gate after the Stalker fight will walk you straight into this supply camp.",
    },
    {
      id: 21,
      title: "Memorystick - Legionnaire 514's Memory",
      text: "Just before entering the sewers (after going down some stairs), do a 180 and head east until you hit the dead end. The body with the memorystick is there.",
    },
  ];

  return (
    <CollectiblesSection
      id="collapsed-rail-bridge"
      title="Collapsed Rail Bridge"
      level="Matrix-11"
      location="Collapsed-Rail-Bridge"
      staticContent={staticContent}
    />
  );
};

export default CollapsedRailBridge;
