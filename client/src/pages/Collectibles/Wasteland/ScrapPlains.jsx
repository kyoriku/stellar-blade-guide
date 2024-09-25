import React from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import useCachedFetch from "../../../hooks/useCachedFetch";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";

const CACHE_KEY = 'scrapPlainsData';

const ScrapPlains = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Central Scrap Plains",
      text: "As soon as you enter the Scrap Plains from the Barren Lands.",
    },
    {
      id: 2,
      title: "Document - Log Data - S2RV1C2-7812's Data",
      text: "Southeast of the supply camp is a small yellow droid. Interact with it to unlock this log.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Further southeast of the previous document. Inside a shipping container near the edge of the cliff.",
    },
    {
      id: 4,
      title: "Locked Legion Supply Box",
      text: "South of the previous Supply Box, in a small area that you can get to by heading west from the previous supply box. Shoot the barrels to free the box from tar. Need the Hacking Tool to unlock.",
    },
    {
      id: 5,
      title: "Beta Core",
      text: "Head east from the last lot of collectibles to the building by the scrap piles. In the middle of the scrap piles is a human corpse with this Beta Core.",
    },
    {
      id: 6,
      title: "Document - Messages - Do Not Disturb",
      text: "On the front of the building east of the previous collectible. Near the ladder.",
    },
    {
      id: 7,
      title: "Legion Camp - Bus Stop",
      text: "Northeast of the previous shack is a literal bus stop which doubles up as a camp.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East of the Bus Stop, in a container. Contains Ranged Enhancement Gear and 1 Omnibolt.",
    },
    {
      id: 9,
      title: "Robot - Passcode - γβθαλα",
      text: "Southeast of the bus stop are some ruins with a robot inside.",
    },
    {
      id: 10,
      title: "Robot - Drone Upgrade Modules",
      text: "South-southeast of the bus stop, all the way down to the end of the level is a broken highway. Get on the highway and the robot is to the far south (watch out for the turret though).",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Go up and to the east from the Waypoint, climbing towards the top. On the way you'll pass a crate.",
    },
    {
      id: 12,
      title: "Beta Core",
      text: "Keep climbing to the top (above the Waypoint), and there's a body with a Beta Core on the edge.",
    },
    {
      id: 13,
      title: "Locked Supply Chest",
      text: "Now head northeast from up top and out the back of the collapsed buildings. Contains 5x Drone Upgrade Modules.",
    },
    {
      id: 14,
      title: "Memorystick - Sentinel 90's Resignation",
      text: "Back west of the bus stop (northeast of the Central Scrap Plains).",
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "Northwest of the Central Scrap Plains Supply Camp, under a small shelter by the cliff face.",
    },
    {
      id: 16,
      title: "Legion Supply Box",
      text: "Southwest of the Waypoint, up the slope, near a large generator.",
    },
    {
      id: 17,
      title: "Robot - Passcode - μλκιαβ",
      text: "As you keep heading up past the two turrets from below, look southwest and there'll be a robot there.",
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "Right behind the robot.",
    },
    {
      id: 19,
      title: "Locked Supply Chest",
      text: "You need to destroy all the red drones working on the towers (and turn the power on down the button) in the same area as the other two. Once done, the door will open on the shack at the top of the hill. Contains 2 WB Pumps.",
    },
    {
      id: 20,
      title: "Can - Corsair Lager",
      text: "Northwest of the Waypoint is a yellow structure. The crate is up high. Head to the north of that dead end from where you are. At the top is a level that drops one of the platforms on a timer. Pull the lever, race back, avoid the two turrets, and the chest is all yours.",
    },
    {
      id: 21,
      title: "Locked Supply Chest",
      text: "North of the Waypoint, jump on the yellow bus and onto the back of the monorail. Contains 4x Bionic Field Generators.",
    },
    {
      id: 22,
      title: "Memorystick - Scavenger 114's Wish",
      text: "Drop down, and slightly north of the monorail cabin is a dead human.",
    }
  ];

  const { content, error, isLoading } = useCachedFetch(
    CACHE_KEY,
    getCollectiblesByLevelAndLocation,
    "Wasteland",
    "Scrap-Plains"
  );

  return (
    <section>
      <Header id="scrap-plains" title="▽ Scrap Plains Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default ScrapPlains;
