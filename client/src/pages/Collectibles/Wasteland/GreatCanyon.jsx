import CollectiblesSection from "../../../components/CollectiblesSection";

const GreatCanyon = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Citizen 224's Memory",
      text: "Head south from the Barren Land Legion Camp into the Great Canyon. Straight ahead is a corpse by a car (and a few Hedgeboars).",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Just slightly south of the previous memorystick.",
    },
    {
      id: 3,
      title: "Memorystick - Scavenger 212's Testament",
      text: "Head west from the two previous collectibles, and there'll be a human corpse in the next passageway.",
    },
    {
      id: 4,
      title: "Memorystick - Citizen 212's Memory",
      text: "Continue west from the previous memorystick and there'll be two Hedgeboars. Next to it is this human corpse and memorystick.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "Next to the previous memorystick.",
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Southwest of the corridor you came into the area, up the hill, is opposite the abandoned ship, is this locked supply crate. Opens with the d-pad mini-game.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "South of the previous locked chest is a Legion Supply box with 2 Omnibolts and Combat Supply Gear.",
    },
    {
      id: 8,
      title: "Memorystick - Citizen 303's Plea",
      text: "Inside the ship (the south side) there's a corpse inside, inside a shipping container.",
    },
    {
      id: 9,
      title: "Robot - Passcode - θηγγγζ",
      text: "Inside the shipping container next to the memorystick one (still inside the ship). You get into it via the same shipping container.",
    },
    {
      id: 10,
      title: "Can - Cryo Cafe Original",
      text: "Behind the ship (west side). Head out via a hole in the wall near the last two collectibles and then head south.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Northeast of the ship is a load of old abandoned cars. This box in the middle of them. Inside is 2 x Omnibolts and Training Gear",
    },
    {
      id: 12,
      title: "Robot - Tumbler Expansion Module",
      text: "In the northwest corner of the large ship, you'll find this robot (south of the Solar Tower region).",
    },
    {
      id: 13,
      title: "Can - Behemoth Green",
      text: "East of the ship to the south-southeast of the Solar Tower Entrance is a chest that needs 2 spheres to open. The one is next to it. The other is to the southwest. There is a can inside.",
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "Southwest of the previous box is a Legion Supply Box.",
    },
    {
      id: 15,
      title: "Supply Camp - Western Great Canyon",
      text: "East of the large ship (and south-southeast of the Solar Tower Entrance Supply Camp) is this Supply Camp.",
    },
    {
      id: 16,
      title: "Document - Prayers - Chapter of Trial 5 - d",
      text: "East of the supply camp, in the closest cliffface is a small cave with a shrine in it.",
    },
    {
      id: 17,
      title: "Memorystick - Scavenger 103's Farewell",
      text: "Southeast of the Western Great Canyon Supply Camp (in the middle of some red plants - watch out for the Tentacles).",
    },
    {
      id: 18,
      title: "Legion Camp - Central Great Canyon",
      text: "East of the previous Supply Camp is this Legion Camp.",
    },
    {
      id: 19,
      title: "Legion Supply Box",
      text: "A little further southeast of the Legion Camp is this Supply Box.",
    },
    {
      id: 20,
      title: "Memorystick - Yohan's Testimony",
      text: "Next to the previous Supply Box.",
    },
    {
      id: 21,
      title: "Memorystick - Citizen 275's Testimony",
      text: "Northwest of the Central Great Canyon Legion Camp is a corpse with this memorystick.",
    },
    {
      id: 22,
      title: "Memorystick - Sentinel 27's Testimony",
      text: "Northeast from the Central Great Canyon Legion Camp is a small nook in the cliff face. Inside you'll find two human corpses, one with this memorystick.",
    },
    {
      id: 23,
      title: "Body Core",
      text: "Next to the previous memorystick.",
    },
    {
      id: 24,
      title: "Robot - Drone Upgrade Modules",
      text: "East of the two previous collectibles, on a thin path that heads east.",
    },
    {
      id: 25,
      title: "Memorystick - Sentinel 188's Advice",
      text: "Carry on east past the robot until you hit a dead-end, where you'll find this memorystick.",
    },
    {
      id: 26,
      title: "Legion Supply Box",
      text: "West of the small nook where you found the Body Core and Memorystick.",
    },
    {
      id: 27,
      title: "Legion Supply Box",
      text: "Head northwest from the previous box to get to this box (in a dead end near 2 Hedgeboars).",
    },
    {
      id: 28,
      title: "Can - Cryo Zero",
      text: "Head south from the previous supply box to a large crate. Opening it will free a flying dartboard. Shoot it and follow it south. Shoot it again, and again, follow it south and then east. Shoot it to get it to drop the can.",
    },
  ];

  return (
    <CollectiblesSection
      id="great-canyon"
      title="Great Canyon"
      level="Wasteland"
      location="Great-Canyon"
      staticContent={staticContent}
    />
  );
};

export default GreatCanyon;
