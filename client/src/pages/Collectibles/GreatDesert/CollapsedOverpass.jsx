import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCollapsedOverpass } from "../../../utils/API/greatDesert";

const CollapsedOverpass = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Follow the Collapsed Overpass to the southern tunnel. There's a supply box inside. Need the Hacking Tool to open."
    },
    {
      id: 2,
      title: "Memorystick - Words Spoken: Embracing Death with a Smile",
      text: "Head west into the other overpass. Jump over the two swinging poles, and at the bottom is a corpse with this memorystick."
    },
    {
      id: 3,
      title: "Memorystick - Words Spoken: Finding Peace Before Death",
      text: "Head south of the other collectible and you'll find this one, by a locked door."
    },
    {
      id: 4,
      title: "Memorystick - Jerome's Faith",
      text: "Continue on up the western overpass to the north, and just as you come back outside, there's a body by a car."
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "Continue north along the road. Slide down and use the pole to make it over the gap. The crate is there on the left, on the other side."
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "Continue north, and next to two Old Droids, on the right is this crate."
    },
    {
      id: 7,
      title: "Beta Core",
      text: "Use the yellow box in that area to climb the wall. On the other side, to the north, near a car, is a body with a Beta Core."
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East-northeast of the Way to the Solar Tower supply camp is a load of boxes and explosives, with a supply crate in the middle."
    },
    {
      id: 9,
      title: "Memorystick - Sentinel 41's Memory",
      text: "Head back towards the buried ruins. North of where the Legion Camp is, on the east side is a bus (east of the Waypoint). Stand on the bus and double jump up to the swinging poles, and then onto the rope to get to the roof. The body is up there."
    },
    {
      id: 10,
      title: "Legion Supply box",
      text: "From there head east to the overpass and then head south until you see a bus up top. Shoot the barrels next to it and the bus will drop, allowing you to climb up. The crate is just as you get up."
    },
    {
      id: 11,
      title: "Nano Suit - Blue Monsoon",
      text: "There's one to the south of the previous collectible but it won't open. Need to have accepted the “Precious Treasure” request to open it."
    },
    {
      id: 12,
      title: "Supply Camp - Debris-Filled Entryway",
      text: "To the north of the previous collectibles is another Supply Camp."
    },
    {
      id: 13,
      title: "Can - Johnson's Highball Lemon",
      text: "Southeast of the Debris-Filled Entryway is some quick sand. On the southeast of that (east of the Waypoint north of the Solar Tower) is a cave. Head inside, kill the 2 Lurkers, and then push the yellow crate to the end and climb the wall. The can crate is at the top."
    },
    {
      id: 14,
      title: "Memorystick Scavenger 404's Advice",
      text: "North of the Supply Camp is a human by a Daily Grind billboard."
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "Just north of the previous memorystick is a supply crate."
    },
    {
      id: 16,
      title: "Body Core",
      text: "From the supply camp, head east into the ruins and there's a body and a Body Core inside one of the western most buildings."
    },
    {
      id: 17,
      title: "Legion Supply Box",
      text: "Head east to the far buildings and there's a supply crate down low, towards the east side of the ruins. Contains 2 Omnibolts and Ranged Protection Gear (2 star)."
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "Head southeast of the previous one, onto the roof with the yellow box. Push it south, and climb on it to be able to latch onto the wall opposite it. Climb to the top, and in the northeast corner of the rooftop with a ramp is this crate. Contains 2 Omnibolts and Ranged Enhancement Gear (2 star)."
    },
    {
      id: 19,
      title: "Robot - Tumbler Expansion Module",
      text: "Now take the ramp west and jump from pole to pole until you reach the robot on a roof."
    },
    {
      id: 20,
      title: "Nano Suit - Black Wave",
      text: "From there, head west, before then jumping up to the roof to the south. The Nano Suit is up there."
    },
  ];

  useEffect(() => {
    fetchCollapsedOverpassCollectibles();
  }, []);

  const fetchCollapsedOverpassCollectibles = async () => {
    try {
      const data = await getCollapsedOverpass();
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
      <Header id="collapsed-overpass" title="▽ Collapsed Overpass Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default CollapsedOverpass;
