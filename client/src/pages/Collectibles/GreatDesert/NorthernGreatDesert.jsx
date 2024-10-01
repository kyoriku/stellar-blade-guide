import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const NorthernGreatDesert = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp - Hypertube",
      text: "West of the Tetrapod, on the east side of the large tubes (the Hypertubes)."
    },
    {
      id: 2,
      title: "Exospine - Suppression-Type",
      text: "Slightly northeast of the Legion Camp is a platform with two Turret Droids on it. The crate with this Exospine is in, is on there"
    },
    {
      id: 3,
      title: "Memorystick - Exile's Resolution",
      text: "North of the Legion Camp, near the Hypertube entrance is a shipping crate with a body on it."
    },
    {
      id: 4,
      title: "Document - Messages - Third Road",
      text: "Next to the corpse that had the aforementioned memorystick. Appears to contain a code: u0ydByKaySSynSyrBy (all y's are upside down)."
    },
    {
      id: 5,
      title: "Document - Journal - Orca Aerospace Company Hypertube System",
      text: "As part of “The King of the Tunnel” side quest, after jumping into the Hyperspace tunnel, you'll end up on the other side of the map. When in the water, dive down to the bottom to find a body with this document."
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Still under the water, on the south side, is a crate to open (it has the quest Fusion Cell inside, as well as some goodies). Also has loads of Micro Coils, Micro Motors and Micro Drives too."
    },
    {
      id: 7,
      title: "Document - Prayer - Chapter of Trial 4 - y",
      text: "Head south out of the water and climb onto land. There's a shrine at the end with this prayer."
    },
    {
      id: 8,
      title: "Memorystick - Rambling of the Ascended",
      text: "Head east up the slope, and you'll come across this body on your way out."
    },
    {
      id: 9,
      title: "Memorystick - Lament of the Fearful",
      text: "Carry on up the path until you reach the rope at the end. The corpse is there on the right."
    },
    {
      id: 10,
      title: "Legion Camp - Underground Secret Passage",
      text: "As soon as you come out of the secret passage and go through the gate, the camp is there. When outside, find the nearest fast-travel point and return to Hypertube legion camp (via the Tetrapod)."
    },
    {
      id: 11,
      title: "Robot - Document - Series - Plastic Hearts, Vol. 4",
      text: "West of the Hypertube legion camp, on the east side of a massive statue, is a robot with this document in."
    },
    {
      id: 12,
      title: "Legion Supply Box",
      text: "On the west side of the statue, up on some scaffolding."
    },
    {
      id: 13,
      title: "Memorystick - Echo's Lament",
      text: "West of the large statue above, is another statue. There's a body there, that has a memorystick as part of the “A United People Cannot be Defeated” side quest."
    },
    {
      id: 14,
      title: "Locked Supply Chest",
      text: "Behind the statue is a passcode locked chest, that has something to do with the Third Road document (u0ydByKaySSynSyrBy). Passcode is yyyyyy (upside down y's, as that's every third character in the cipher)."
    },
    {
      id: 15,
      title: "Document - Messages - Truth of the Cradle / The Truth Under the City of Xion",
      text: "As part of the “A United People Cannot be Defeated” side quest, just a bit further north and you'll have to shoot down some crates with these two documents in them."
    },
    {
      id: 16,
      title: "Document - Journal - I Saw It",
      text: "Northwest of the Hypertube Legion Camp is a pod. Next to it is a document. As part of “Let There Be Light Again” side quest."
    },
    {
      id: 17,
      title: "Supply Camp - Great Desert Outskirts",
      text: "North-northwest from the Hypertube Legion Camp is this Supply Camp. Just to the south of the large ship."
    },
    {
      id: 18,
      title: "Memorystick - Citizen 779's Consolation",
      text: "Just to the northwest of the camp, by the rocks."
    },
    {
      id: 19,
      title: "Memorystick - We Must Find Them",
      text: "East of the Great Desert Outskirts Supply Camp is a medium-sized statue with pillars sticking out the ground. The two corpses by the central statue have memorysticks on them."
    },
    {
      id: 20,
      title: "Memorystick - Believer's Screams",
      text: "On the other side of the statue."
    },
    {
      id: 21,
      title: "Memorystick - Scavenger 103's Memory",
      text: "North of the ship, by a tree, pretty much out of the map, you'll find a body with this memorystick."
    },
    {
      id: 22,
      title: "Can - Cryo Cafe Mocha",
      text: "East-northeast of the Great Desert Outskirts Supply is an Ice Camp cooler. Interact with it, shoot the 3 targets, and then pick up the can."
    },
    {
      id: 23,
      title: "Robot - Drone Upgrade Module",
      text: "East-southeast from the ship is a large statue. There's a robot next to it."
    },
    {
      id: 24,
      title: "Memorystick - Scavenger 173's Lament",
      text: "East-northeast from the robot are some ruins. Next to the yellow box is a human body with this memorystick."
    },
    {
      id: 25,
      title: "Nano Suit - Daily Sailor",
      text: "Free the yellow box by exploding the barrels, then use it to climb up the north wall, before heading out the back and scaling around the outside of the building to get to the top. When up there use the poles to get across to the Nano Suit crate."
    },
    {
      id: 26,
      title: "Supply Camp - Twin Rocks",
      text: "East of the building where the last two collectibles were."
    },
    {
      id: 27,
      title: "Document - Promotions - Ark-Tech Pioneers Developing the Green Land!",
      text: "ast of the Supply Camp, midway up the remains of a building - use the rocks around the edge to get up to this level."
    },
    {
      id: 28,
      title: "Locked Supply Chest",
      text: "Up top in the same building is this locked supply chest. Beat the mini-game to gain access."
    },
    {
      id: 29,
      title: "Supply Camp - Abyss Levoire Entrance",
      text: "Just  to the west of the Abyss Levoire."
    },
    {
      id: 30,
      title: "Memorystick - Sentinel 95's Regret",
      text: "Northeast of the Abyss Levoire (up the hill, near some crates and barrels).",
    },
    {
      id: 31,
      title: "Document - Prayer - Chapter of Trial 2 - 0",
      text: "East of the previous memorysticks are a load of dilapidated buildings. This is one floor up in one of the western ones.",
    },
    {
      id: 32,
      title: "Memorystick - Sentinel 71's Resignation",
      text: "East of the previous one, inside another set of ruinous buildings. In the centre of this small collection of buildings.",
    },
    {
      id: 33,
      title: "Memorystick - Naomi's Testament",
      text: "The northeastern most building, just at the base of it, outside.",
    },
    {
      id: 34,
      title: "Can - Liquid Fire",
      text: "South of the aforementioned memorystick, on the roof, is an Ice Camp cooler. Interact with it and shoot the explosive barrels before they hit you to unlock this one. Make sure you have plenty of ammo!",
    },
    {
      id: 35,
      title: "Robot - Passcode - λβιιδα",
      text: "Just to the north of the Buried Ruins Outskirt Supply Camp is a robot. Kill it for this passcode.",
    },
    {
      id: 36,
      title: "Locked Supply Chest",
      text: "North of the aforementioned Supply Camp. Shoot the target to the north to drop a rope. Then head northeast to the crates at the end. You then want to swing from rope to rope, until you get dropped onto the chest. The passcode is λβιιδα.",
    }
  ];

  useEffect(() => {
    fetchNorthernGreatDesertCollectibles();
  }, []);

  const fetchNorthernGreatDesertCollectibles = async () => {
    const cacheKey = "Great-Desert_Northern-Great-Desert";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Great-Desert", "Northern-Great-Desert");
      setContent(data);

      await cacheData(cacheKey, data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header id="northern-great-desert" title="▽ Northern Great Desert Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default NorthernGreatDesert;
