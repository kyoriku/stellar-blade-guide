import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getSolarTower } from "../../../utils/API/greatDesert";

const SolarTower = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Great Desert",
      text: "As soon as you land in the Great Desert, this camp is right next to the Tetrapod."
    },
    {
      id: 2,
      title: "Supply Camp - Central Great Desert",
      text: "South from the small rocky hill where you begin the “Reboot!!!” side quest. Move the yellow box around until you can jump up to the ledge. The supply camp is there."
    },
    {
      id: 3,
      title: "Locked Supply Chest",
      text: "Look up to the East while standing up on the supply camp ledge. You will see a small target hovering in the air, shoot it and a rope will drop out of it. Jump and swing across to the other side to find the chest."
    },
    {
      id: 4,
      title: "Body Core",
      text: "Back on the supply camp ledge, look to the South and you will see some ledges you can jump to. Jump across to the ledge and continue around to find the Body Core."
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "On the ground level directly beneath the previous Body Core."
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "Southwest of the previous supply box, in the middle of the desert."
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "South of the previous supply box, on the scaffolding behind a sign."
    },
    {
      id: 8,
      title: "Robot - Passcode",
      text: "East of the previous collectible, behind a fence that can be entered by breaking the boxes."
    },
    {
      id: 9,
      title: "Memorystick - Lament of the Isolated",
      text: "Next to the aforementioned robot."
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "On the roof of the building. Use the ledges to climb up."
    },
    {
      id: 11,
      title: "Memorystick - Failed Sentinel's Lament",
      text: "Also on the same roof, near the previous bupply Box."
    },
    {
      id: 12,
      title: "Memorystick - Citizen 218's Memory",
      text: "Southeast from the ruined building, underneath the overpass, between a car and a bus."
    },
    {
      id: 13,
      title: "Supply Camp - Abandoned Overpass",
      text: "North-northwest of the Solar Tower, up on the overpass, above the previous collectible."
    },
    {
      id: 14,
      title: "Document - Series - Notes on EVE Protocol 4",
      text: "West of the supply camp, by some rubble."
    },
    {
      id: 15,
      title: "Memorystick - Sentinel 58's Advice",
      text: "To the left of the previous collectible, by the same pile of rubble."
    },
    {
      id: 16,
      title: "Memorystick - Whiiir Whiiir",
      text: "Follow the overpass west until you see a red car by the edge. The sentinel is leaning against the western side of the car."
    },
    {
      id: 17,
      title: "Exospine - Recovery-Type",
      text: "Just slightly north of the previous memorystick. On the metal walkway of the overpass."
    },
    {
      id: 18,
      title: "Supply Camp - Way to the Solar Tower",
      text: "Directly to the east of the Abandoned Overpass supply camp."
    },
    {
      id: 19,
      title: "Memorystick - Teddy's Memory / Passcode",
      text: "To the south-southeast of the Solar Tower, in the corner of the fenced off area, by a floodlight. The passcode is: naEdrr, and it opens Teddy's Locker in Xion."
    },
    {
      id: 20,
      title: "Locked Supply Chest",
      text: "About halfway up the solar tower."
    },
    {
      id: 21,
      title: "Lily Outfit - Off-Duty",
      text: "On the other side of the solar tower."
    },
    {
      id: 22,
      title: "Legion Supply Box",
      text: "Northwest of the solar tower, up on the cliffs overlooking the area. Contains an Omnibolt and Training Gear."
    },
    {
      id: 23,
      title: "Locked Supply Chest",
      text: "Follow the cliffs to the west until you come across a crate to open. Make sure you have some ammo with you."
    },
    {
      id: 24,
      title: "Document - Log Data - S2RV1C2-875687's Data",
      text: "East from the previous supply chest in the ruined city area."
    },
    {
      id: 25,
      title: "Legion Camp - South of Buried Ruins",
      text: "Northeast of the Solar Tower, in an enclosed area in the ruins (if you're coming from the above document, then destroy the barrel in the southern wall to get access to this area)."
    },
    {
      id: 26,
      title: "Document - Series - The Truth, Article 4",
      text: "Just slightly north of the South of Buried Ruins Legion Camp."
    },
    {
      id: 27,
      title: "Document - Prayer - Chapter of Trial 3 - a",
      text: "Head east out the gate and then head into the building to the north. This collectible is there, in a box on the shrine."
    },
    {
      id: 28,
      title: "Locked Supply Chest",
      text: "South of the previous collectible, in a building, up a floor."
    },
    {
      id: 29,
      title: "Legion Supply Box",
      text: "South of the ruins (on the other side of them). Near a downed telegraph pole."
    }
  ];

  useEffect(() => {
    fetchSolarTowerCollectibles();
  }, []);

  const fetchSolarTowerCollectibles = async () => {
    try {
      const data = await getSolarTower();
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
      <Header id="solar-tower" title="▽ Solar Tower Collectibles" />
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

export default SolarTower;
