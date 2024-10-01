import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const CentralGreatDesert = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Next to the rock formation beside the waypoint."
    },
    {
      id: 2,
      title: "Memorystick - Citizen 206's Memory",
      text: "Slightly west is a rock formation. On the eastern side is a body with this memorystick."
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Inside the same rock formation is a supply box. Use an Explosive Round to destroy the wood blocking the way in."
    },
    {
      id: 4,
      title: "Memorystick - Emil's Lament",
      text: "South of the previous supply box, in the rocks, near the cliff face."
    },
    {
      id: 5,
      title: "Can - Newfoundland Dry Zero",
      text: "A little further northwest from the memorystick, in a ditch, is a crate sticking out of the sand. Shoot it for this can."
    },
    {
      id: 6,
      title: "Robot - Document - Series - The Xion 4",
      text: "West of the previous can, in some rocks."
    },
    {
      id: 7,
      title: "Supply Camp - Exile's Passage",
      text: "On the road to Xion, in the far southwest of the Great Desert."
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Directly north of the path to Xion (west-northwest from the Central Great Desert Supply Camp)."
    },
    {
      id: 9,
      title: "Memorystick - Sentinel 82's Memory",
      text: "Slightly east from the previous supply box, outside a rock formation."
    },
    {
      id: 10,
      title: "Memorystick - Citizen 109's Resolution",
      text: "Inside the aforementioned rock structure."
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Next to the previous memorystick."
    },
    {
      id: 12,
      title: "Can - Nectar Cranberry",
      text: "Northwest of the rock formation with the previous collectibles, climb the wall and platform on the drones until you can reach the platform with the ice camp cooler."
    },
    {
      id: 13,
      title: "Memorystick - Galaxy Alan's Lament / Passcode - λλλλαθ",
      text: "From the previous can, just forward and to the west. There's a door you can open there. The corpse is inside with the memorystick and passcode."
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "On the other side of the same room where you just got the previous memorystick and passcode from."
    },
    {
      id: 15,
      title: "Legion Camp - Northern Great Desert",
      text: "Northeast of the previous collectibles. Slightly south-southeast from the Tetrapod."
    },
    {
      id: 16,
      title: "Memorystick - Citizen 246's Recollection",
      text: "At the top of the building next to the Legion Camp."
    },
    {
      id: 17,
      title: "Document - Books - I Heard It",
      text: "Next to the aforementioned corpse is a bookcase with this book, as part of the “Let There Be Light Again” side quest."
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "West-northwest of the previous Legion Camp, near a bridge protruding out of the sand."
    },
    {
      id: 19,
      title: "Can - Milky Pop Zero",
      text: "Head north from the previous supply box and go around the back of the rock feature. Climb up on the north-facing wall, look up and shoot a target to the northeast, and then use the swinging poles and rope to get up to the top where the ice camp cooler is."
    },
    {
      id: 20,
      title: "Beta Core",
      text: "Head south from the can, and drop down to the southeast. There's a body with a Beta Core there."
    },
    {
      id: 21,
      title: "Legion Supply Box",
      text: "North of the Tetrapod are two rock features. On the westside of the most northerly one is this crate."
    },
    {
      id: 22,
      title: "Memorystick - Scavenger 390's Memory",
      text: "West-northwest of the previous supply box are old ruins of a building. At the top is this memorystick. You can climb up using the interior of the building, and double jump and dash from the opposite corner to get there."
    }
  ];

  useEffect(() => {
    fetchCentralGreatDesertCollectibles();
  }, []);

  const fetchCentralGreatDesertCollectibles = async () => {
    const cacheKey = "Great-Desert_Central-Great-Desert";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Great-Desert", "Central-Great-Desert");
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
      <Header id="central-great-desert" title="▽ Central Great Desert Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default CentralGreatDesert;
