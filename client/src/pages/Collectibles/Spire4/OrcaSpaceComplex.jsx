import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollectiblesByLevelAndLocation } from "../../../utils/API/collectibles";
import { getCachedData, cacheData } from "../../../utils/indexedDB";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const OrcaSpaceComplex = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp - Space Complex Entryway",
      text: "By the Tetrapod at the start of the level.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 753's Memory",
      text: "Inside the cave once you dive underwater, there will be a corpse with the memory stick.",
    },
    {
      id: 3,
      title: "Memorystick - Legionnaire 717's Order",
      text: "In the next area, near the dam, next to some Houndborgs.",
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 742's Complaint",
      text: "Head through the door underneath the waterwall. Also contains the passcode: L0rnKy.",
    },
    {
      id: 5,
      title: "Drone Pack - Lop Bunny",
      text: "Climb the pillar in the northeast and in the pipe you'll find this drone pack.",
    },
    {
      id: 6,
      title: "Legion Camp",
      text: "Up the ladders in the far corner, leading up to the water controls.",
    },
    {
      id: 7,
      title: "Memorystick - Legionnaire 712's Memory",
      text: "Once you've made it through the door into the facility, when the corridor forks, the left one has this memorystick in it.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "There's also a crate to shoot down above it.",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "At the end of the corridor, before going up the stairs to the Body Core (the next collectible).",
    },
    {
      id: 10,
      title: "Body Core",
      text: "Now go up the stairs and there's a human at the end of the path with this core. In some shallow water.",
    },
    {
      id: 11,
      title: "Memorystick - Legionnaire 466's Memory",
      text: "On the correct route, just down the rocks from where the actual route is taking you.",
    },
    {
      id: 12,
      title: "Legion Supply Box",
      text: "Once you reach the section where the floor stars falling, go through the door on the left and the crate is inside.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnaire 716's Proposal",
      text: "AAfter jumping across the sections of the floor that area falling, there will be a corpse with the memory stick right by the stairs. .",
    },
    {
      id: 14,
      title: "Supply Camp - Hypertube Entrance",
      text: "At the top of the stairs, before you enter the hypertube.",
    }
  ];


  useEffect(() => {
    fetchOrcaSpaceComplexCollectibles();
  }, []);

  const fetchOrcaSpaceComplexCollectibles = async () => {
    const cacheKey = "Spire-4_Orca-Space-Complex";
    try {
      const cachedEntry = await getCachedData(cacheKey);
      const now = Date.now();

      if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
        setContent(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const data = await getCollectiblesByLevelAndLocation("Spire-4", "Orca-Space-Complex");
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
      <Header id="orca-space-complex" title="▽ Orca Space Complex Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        skeletonVariant="large"
      />
    </section>
  );
};

export default OrcaSpaceComplex
