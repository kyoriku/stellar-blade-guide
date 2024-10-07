import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import usePersistentCache from "../../../hooks/usePersistentCache";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const ConstructionZone = () => {
  const { data: content, loading: isLoading, error } = usePersistentCache(
    "Eidos-7_Construction-Zone",
    getCollectiblesByLevelAndLocation,
    "Eidos-7",
    "Construction-Zone"
  );

  const staticContent = [
    {
      id: 1,
      title: "Locked Legion Supply Box",
      text: "Need Drone Hacking Tool to unlock - After dropping into the construction zone (off the road), the chest is behind you, to the east, near a large truck and some shipping containers. We'll include this later when you can return to the area and get the rest of the collectibles.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 286's Recollection",
      text: "Southwest of where you drop in, on the ground level, underneath a half-finished floor, is this corpse.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Follow the corridor round on the ground, all the way to the southwest. There you'll find this case with some supplies, an Omnibolt, and the Beta Enhancement Gear.",
    },
    {
      id: 4,
      title: "Supply Camp - Construction Zone",
      text: "In the centre of the Construction Zone area. On the same level as the area you drop in at. Above the two previous collectibles (in-between them).",
    },
    {
      id: 5,
      title: "Locked Legion Supply Chest",
      text: "In the northwest building, in the corner near the generator.",
    },
    {
      id: 6,
      title: "Exospine - Protection Type",
      text: "In the northwest corner (to the right of the elevator and up the shipping crates). Pretty much above the Locked Supply Chest.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "Turn on the generator to power the elevator, and go up the lift. At the top, jump to the north for this supply box.",
    },
    {
      id: 8,
      title: "Memorystick - Legionnaire 212's Question",
      text: "Beneath where the lift takes you to in the northwest corner. When going for the previous supply box, on your way back you'll end up in this room where the corpse is.",
    },
    {
      id: 9,
      title: "Memorystick - Athena 82's Orders",
      text: "In the northern area of the Construction Zone (after passing a statue), there's a corpse there, inside the building.",
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "Head out the window to the south from the crate with the crane ID card, and look to the southwest. Run and jump onto that rope and swing to the platforms over the other side. Then, jump onto the scaffolding to the southwest. The supply crate is a level down from the top of said scaffolding.",
    },
    {
      id: 11,
      title: "Robot - Tumbler Expansion Module",
      text: "South of the supply camp in the middle of the Construction Zone is this robot with a Tumbler Expansion Module.",
    },
    {
      id: 12,
      title: "Can - Potential Blast",
      text: "In the east-southeast corner (near another lift), climb the wrecked building to the top, and you'll find a can on the table there.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnaire 326's Transmission",
      text: "Use the crane to position the large steel beam to the east (near the digger). Then, use it to jump up to the two openings in the wall. The left one leads to a floor with a corpse to get this transmission from.",
    },
    {
      id: 14,
      title: "Body Core",
      text: "Get back on the beam and jump into the other building. The Body Core is on the floor there.",
    },
    {
      id: 15,
      title: "Earrings - Crimson Tear",
      text: "Turn around and use the yellow ledges to climb up to the next floor. The earrings are in the back of the room.",
    },
    {
      id: 16,
      title: "Legion Supply Crate",
      text: "Use the crane to destroy the wall to the left of the exit out of the Construction Zone, then head round to grab it before moving on.",
    },
    {
      id: 17,
      title: "Nano Suit - Red Passion",
      text: "Use the crane to destroy the right wall this time, and use the beam to get across into that room. This Nano Suit is inside.",
    }
  ]

  return (
    <section>
      <Header id="construction-zone" title="▽ Construction Zone Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ConstructionZone;
