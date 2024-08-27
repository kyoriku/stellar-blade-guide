import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getBuriedRuins } from "../../../utils/API/greatDesert";

const BuriedRuins = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Laughter of the Isolated",
      text: "Before going north, head west and then north through the rocks. The building straight ahead (to the left) has two Turret Droids in it. The memorystick is under them."
    },
    {
      id: 2,
      title: "Legion Camp - West of Buried Ruins",
      text: "Head north, along the outer wall, to unlock the West of Buried Ruins Legion Camp."
    },
    {
      id: 3,
      title: "Can - Starwell ",
      text: "West of the legion camp is a Road Closed sign in front of a large rock. In the middle will be a glint every so often. Drop a Smart Mine and it'll spawn 2 Creepers and a Lurker (as well as this can chest). Kill the enemies, grab the can."
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "In the next area to the right, in the northeast corner, is a supply chest."
    },
    {
      id: 5,
      title: "Memorystick - May's Memory",
      text: "South of the previous collectible is a enclosed area, which is where you need to go for the “A Treasure with a Name” side quest. This is the 1st of 3 memorysticks to collect."
    },
    {
      id: 6,
      title: "Memorystick - August's Memory",
      text: "Also part of the “A Treasure with a Name” side quest. This is the 2nd of 3 memorysticks to collect."
    },
    {
      id: 7,
      title: "Memorystick - July's Memory",
      text: "Also part of the “A Treasure with a Name” side quest. This is the 3rd of 3 memorysticks to collect."
    },
    {
      id: 8,
      title: "Document - Log Data - S2RV1C2-99991's Data",
      text: "From the Legion Camp, go forward under the green light, and to the right is a bot with this document on it."
    },
    {
      id: 9,
      title: "Memorystick - Citizen 360's Complaint",
      text: "Just slightly north of the previous bot is a human, near a knee high wall."
    },
    {
      id: 10,
      title: "Robot - Drone Upgrade Modules",
      text: "Southeast of the memorystick, on the main road from the south, is a robot behind a bus."
    },
    {
      id: 11,
      title: "Memorystick - Scavenger 388's Plea",
      text: "Further south, near an Old Droid and a couple of Droid Turrets."
    },
    {
      id: 12,
      title: "Legion Supply Box",
      text: "Back to where you found Citizen 360's Complaint. Head west to get into a warehouse where this chest is."
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "In the northeastern part of the ruins, there's a bus and a ladder leading to the roofs. Head up. On the first roof you jump to, there's a supply chest there."
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "On the next roof, the one with the big yellow box to move."
    },
    {
      id: 15,
      title: "Can - Potential Frost",
      text: "On the next roof, where you have to wall jump, do a 180 and you'll see a can crate behind some lasers. Jump and dodge to get through them to get this can."
    },
    {
      id: 16,
      title: "Memorystick - Yo's Mutterings, Ryu's Rage, So's Resolution, Lune's Last Words, Mel's Faith and Raan's Testament",
      text: "Defeat Abaddon on the roof during the side quest, “An Eye for an Eye, a Tooth for a Tooth” and it'll drop 6 memorysticks."
    },
    {
      id: 17,
      title: "Supply Camp - Crumbling Rooftop",
      text: "From the rooftop, head east-northeast for this supply samp. On the adjacent rooftop."
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "On the rooftop to the north of the supply camp."
    },
    {
      id: 19,
      title: "Can - Johnson's Highball Ginger",
      text: "Drop down to the east, and then in the southeast corner of the next area you'll see a Fiz machine with this can."
    },
    {
      id: 20,
      title: "Memorystick - Scavenger 438's Plea",
      text: "Behind the Fiz machine, on the other side of the wall."
    },
    {
      id: 21,
      title: "Locked Supply Chest",
      text: "Head west and into the building underneath the Supply Camp. Requires a passcode, which you'll find in the Opera House. Contains 3 Omnibolts."
    },
    {
      id: 22,
      title: "Legion Supply Box",
      text: "Now head east to the dome shaped building. There's a supply box on the western side."
    },
    {
      id: 23,
      title: "Document - Series - The Truth, Article 6",
      text: "Just to the northeast of the supply box is a newspaper dispenser with this newspaper in."
    },
    {
      id: 24,
      title: "Robot - Passcode - nnauud",
      text: "Downstairs in the Opera House (the dome shaped building) is a robot with this passcode."
    },
    {
      id: 25,
      title: "Memorystick - Sentinel 477's Plea",
      text: "Northeast corner of the Opera House, near a bus."
    },
    {
      id: 26,
      title: "Can - The Haven Milk Tea",
      text: "To get this one, you need to solve a door puzzle to the north of the Opera House. Take out the turret and then put the hover storage on the pressure plates, so that they all equal 4, 6 and 7 (from west to east). Once you've done that and got all greens, open the door to the northeast. Inside is a can chest."
    },
    {
      id: 27,
      title: "Legion Supply Box",
      text: "Same garage is a supply crate. Contains Gold Gear (3 star) and an Omnibolt."
    },
    {
      id: 28,
      title: "Legion Supply Box",
      text: "Northeast of the puzzle area, on the road out of the ruins."
    },
    { 
      id: 29,
      title: "Can - Behemoth Black",
      text: "East of the previous pressure plate puzzle is another one. This time put the yellow boxes on 12, 2 and 13. Once you do, the can pops out the chest at the south end of the area.",
    },
    {
      id: 30,
      title: "Body Core",
      text: "At the end of the northeastern street is a body with a Body Core on it.",
    },
    {
      id: 31,
      title: "Legion Camp - Middle Path Between Ruins",
      text: "Head south-southeast from the Opera House and then take the street east. The Legion Camp is midway down that street.",
    },
    {
      id: 32,
      title: "Can - Mountain Sparkle Everest",
      text: "Head northeast from the camp and push the yellow block all the way to the north to block the lasers. The can is behind the lasers.",
    },
    {
      id: 33,
      title: "Legion Supply Box",
      text: "South of the Opera House, jump into the building near the explosive crates. The supply box is straight ahead. Can only be opened with the Hacking Tool (which you should have by now)."
    },
    {
      id: 34,
      title: "Can - Liquid Nuclear",
      text: "From inside the same area, head to the right and over the wall. Push the yellow block all the way around to reach the yellow ledge at the other end of the room. Then jump up, go to the left and drop down.",
    },
    {
      id: 35,
      title: "Memorystick - Sentinel 39's Resolution",
      text: "In the same area as the can above.",
    },
    {
      id: 36,
      title: "Legion Supply Box",
      text: "South of the previous collectibles are some lasers hiding another chest. The middle sensors are on a timer. When they're off, jump through them to get this supply box.",
    },
    {
      id: 37,
      title: "Beta Core",
      text: "Northwest from the previous supply box and slightly southwest of the Crumbling Rooftop supply camp is a body with a Beta Core.",
    },
    {
      id: 38,
      title: "Legion Camp - North of Buried Ruins",
      text: "North from the previous beta core and slightly northwest from the Crumbling Rooftop supply camp is the North of Buried Ruins legion camp.",
    },
    {
      id: 39,
      title: "Supply Camp - Buried Ruins Outskirts",
      text: "North-northeast of the North of Buried Ruins legion camp.",
    },
    {
      id: 40,
      title: "Legion Supply Box",
      text: "Heading Northwest along the outskirts of the Buried Ruins, roughly west of the North of Buried Ruins Legion Camp, is a building you can enter with this crate inside. Contains 2 Omnibolts and Combo Attack Enhancement Gear (2 star).",
    },
    {
      id: 41,
      title: "Memorystick - Sentinel 15's Plea",
      text: "Southwest of the Buried Ruins, at the base of one of the pillars of the large highway overhead. ",
    },
    {
      id: 42,
      title: "Legion Supply Box",
      text: "West of the previous collectible. Move the yellow box to pillar with the bars, then jump up and across. The supply box is at the top.",
    },
  ];

  useEffect(() => {
    fetchBuriedRuinsCollectibles();
  }, []);

  const fetchBuriedRuinsCollectibles = async () => {
    try {
      const data = await getBuriedRuins();
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
      <Header id="buried-ruins" title="▽ Buried Ruins Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default BuriedRuins;
