import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getClosedOffPlatform } from "../../../utils/API/matrix11";

const closedOffPlatform = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp",
      text: "As soon as you land on Matrix 11, it's on your left.",
    },
    {
      id: 2,
      title: "Document - Announcements - Great Desert Crossing Exploration Team Advertisement",
      text: "You'll find this one on the floor by the fast-travel phone booth in the Supply Camp.",
    },
    {
      id: 3,
      title: "Great Desert Memorystick - The Last Theorum of an Unknown",
      text: "Before taking the lift down from the landing pad, head right into the toilets and the human corpse is there.",
    },
    {
      id: 4,
      title: "Earrings - Blue Point",
      text: "Before going up the ladder over the train carriage (which you can actually wander through the doors of too), go into the train carriage. There's a crate down the east end.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "When you fight your first two Skullings, there's a box in that corridor (south side).",
    },
    {
      id: 6,
      title: "Robot - Document - Announcements - Transport Delay Notice",
      text: "Crash through the wooden struts down the stairs and the robot is right ahead.",
    },
    {
      id: 7,
      title: "Locked Supply Chest",
      text: "West of the next carriage, outside, is another chest.",
    },
    {
      id: 8,
      title: "Memorystick - Employee 38's Memory",
      text: "In the next train track section, on the right. Hard to miss.",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "After defeating your first Skull Trooper, head to the right and double back to where you come from (opening the shortcut). The chest is there.",
    },
    {
      id: 10,
      title: "Memorystick - Legionnarie 547's Testimony",
      text: "After Adam tells you to take the high road. On the left is a blocked door with a yellow sign above it. Approach it and an enemy will crash through. In the room it came out of is a memorystick and a supply box.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Same area, has a Melee Protection Gear (2 star) and an Omnibolt inside of it.",
    },
    {
      id: 12,
      title: "Nano Suit - Daily Knitted Dress",
      text: "In the next open-ish area, there's a train carriage (after a fight with a handful of enemies) on the south wall. Down the end is a crate with this Nano Suit inside.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnarie 569's Recollection",
      text: "When you see the Hive blocking the way, take a left out the door, there's a body with a memory stick just to the right.",
    },
    {
      id: 14,
      title: "Robot - Tumbler Expansion Module",
      text: "Head southwest of the previous memorystick and there's a robot there with a Tumbler Expansion Module inside.",
    },
    {
      id: 15,
      title: "Legion Camp",
      text: "At the end of the train tracks and down the ladder is safety.",
    },
    {
      id: 16,
      title: "Robot - Drone Upgrade Modules",
      text: "Above the Legion Camp (just one level up, above the workbench) - Contains 2 x Drone Upgrade Modules.",
    },
    {
      id: 17,
      title: "Exospine - Reflex-Type",
      text: "In the front of the train carriage that just flew down the tracks and crashed.",
    },
    {
      id: 18,
      title: "Memorystick - Legionnaire 552's Advice / Passcode - ardu0d",
      text: "In the next corridor, head to the end and take a right. The corpse and passcode are at the end of that small corridor.",
    }
  ];

  useEffect(() => {
    fetchClosedOffPlatformCollectibles();
  }, []);

  const fetchClosedOffPlatformCollectibles = async () => {
    try {
      const data = await getClosedOffPlatform();
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
      <Header id="closed-off-platform" title="▽ Closed Off Platform Collectibles" />
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
              <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default closedOffPlatform;
