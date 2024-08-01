import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getWastelandContinued } from "../../../utils/API/wasteland";

const WastelandContinued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Can - Mountain Sparkle Haller",
      text: "Now that you have Double Jump, fast-travel to the Western Great Canyon Supply Camp and head north, and climb the cliffs to the north. Keep running, jumping and climbing until you reach the top. There’s an ice chest with this can in it.",
    },
    {
      id: 2,
      title: "Beta Core",
      text: "Just to the right of the can is a human body with this Beta Core in it.",
    },
    {
      id: 3,
      title: "Adam Outfit - Junkman",
      text: "Head up further (to the north) and then head west and south across the bridge. There you'll find a lot of enemies and also a crate with this inside.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Northeast of the Barren Land Legion Camp is a wall you can climb (near the waypoint, north facing cliff face).",
    },
    {
      id: 5,
      title: "Document - Journal - Investigation Journal",
      text: "You'll find this as part of the side quest, “Keeping Secrets” - part of the Su and Enya storyline. North of the Solar Tower.",
    },
    {
      id: 6,
      title: "Document - Journal - Search Record",
      text: "Also part of the side quest, “Keeping Secrets” - part of the Su and Enya storyline. Northeast of the Solar Tower.",
    },
    {
      id: 7,
      title: "Document - Journal - Arin's Journal",
      text: "During “Stolen Treasure,” you'll have to head to the Villa in the Scrap Plains (east of the Central Scrap Plains Supply Camp). Upstairs near the bot. Part of the quest.",
    },
    {
      id: 8,
      title: "Beta Core",
      text: "Northwest of the Junkyard Supply Camp is a wallrunning section that you need to Double Jump for. Head back there and follow the path to the end for this Beta Core.",
    },
    {
      id: 9,
      title: "Can - Elixir Green",
      text: "East-northeast of the Central Scrap Plains Supply Camp (just slightly west of the Waypoint) are some metal platforms. Climb to the top (needs Double Jump) and you'll find the can up there.Use the ramp on the west to get up top.",
    },
    {
      id: 10,
      title: "Can - The Haven Green Tea",
      text: "take the path up to the north from the Solar Tower and bend round to the east, when you drop down (while still heading east), where the Racer's High Nano Suit was, you're actually going to want to drop down to the south, and then platform the way along a few cliffs and up a lot of them too. There's only one way to go, so stick on the path and you'll be at the ladder and the can in no time.",
    },
    {
      id: 11,
      title: "Can - Nectar Orange",
      text: "Next to the Central Great Canyon Legion Camp is a billboard. Pull over the yellow crate from the north to the steel girder. Double jump up and walk across the billboard for this can.",
    },
    {
      id: 12,
      title: "Nano Suit - La Vie En Rose",
      text: "Use the code B0aydS on the ship container to the west of the Western Grand Canyon Supply Camp (part of the “Recruit Passcode Specialists” Request).",
    },
    {
      id: 13,
      title: "Document - Prayers - Chapter of Salvation 0 - Omega",
      text: "In the same container as the previous Nano Suit.",
    },
    {
      id: 14,
      title: "Document - Messages - I'm Leaving",
      text: "After finishing D1g-g2r's side quests he'll leave to go to Xion. When he does, return to the Wasteland and head to the Scrapyard. On a large computer screen to the east of the entrance (under a box and by a ladder), you'll be able to interact with the screen to grab this collectible.",
    }
  ];

  useEffect(() => {
    fetchWastelandContinuedCollectibles();
  }, []);

  const fetchWastelandContinuedCollectibles = async () => {
    try {
      const data = await getWastelandContinued();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header
        id="wasteland-continued"
        title="▽ Wasteland Collectibles (Continued)"
        subtitle="The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them."
      />
      <ErrorMessage message={error} />
      {!error && (
        <div>
          {staticContent.map((item, index) => (
            <article key={item.id}>
              <ContentText title={item.title} text={item.text} />
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
              )}
              <hr></hr>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default WastelandContinued
