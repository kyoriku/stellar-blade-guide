import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { getSpaceLogisticsComplex } from '../../../utils/API/spire4';

const SpaceLogisticsComplex = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "In the northwest corner of the next area. Contains an Omnibolt and Beta Recovery Gear (3 star)",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "There's another one in the northeast corner.",
    },
    {
      id: 3,
      title: "Exospine - Judgement-Type",
      text: "Put the 4 balls in their respective holes in the first open area and this will literally drop out of the sky. Well, the container it's in will.",
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 725's Question",
      text: "After the chase sequence, directly ahead of you.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "South from the dead body, up a ladder on the west side",
    },
    {
      id: 6,
      title: "Legion Camp",
      text: "After getting past the first set of lasers.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "After the first main conveyor belt, where you have to go right and the boxes are coming down on a slope, head up that slope and follow it to the end. There's a supply box with an Omnibolt and Burst Charge Gear (3 star) inside.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "At the top of the fast moving conveyor belt that goes up, jump up and to the right for this chest. Only crafting supplies, so if you don't want to risk it, you're not missing much.",
    },
    {
      id: 9,
      title: "Body Core",
      text: "After you drop down, before moving through the next set of lasers, do a 180, there's a Body Core there under the conveyor belt ramp.",
    },
    {
      id: 10,
      title: "Supply Camp - Space Logistics Centre",
      text: "After finishing the conveyor belt section, this camp is straight ahead.",
    },
    {
      id: 11,
      title: "Can - Liquid Lightning",
      text: "East of the Supply Camp, behind a crate. Perhaps the easiest to find out of all of them so far."
    },
    {
      id: 12,
      title: "Memorystick - Legionnaire 775's Plea",
      text: "Where the ropes are, drop down and deal with the enemies. This memorystick is on the body in the corner.",
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "After swinging on the ropes, while the way out is up, look right and jump across for this crate. Needs the Hacking Tool.",
    },
    {
      id: 14,
      title: "Locked Supply Chest",
      text: "Turn east from the supply box and climb onto the shipping crates. This cache is round the back.",
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "Opposite the ladder you need to get out is a crate. Use the moving crates to get across to it.",
    },
    {
      id: 16,
      title: "Legion Camp",
      text: "Through the big door and down the rope. On your left.",
    },
    {
      id: 17,
      title: "Legion Supply Box",
      text: "As you come back around the cars (after doing a U-turn of sorts), there's a supply box in the corner, behind some security barricades. Just contains some crafting supplies.",
    },
    {
      id: 18,
      title: "Robot - Tumbler Expansion Module",
      text: "This one is on the main route, just under the turrets, before the entrace to the Raphael Space Centre.",
    },
    {
      id: 19,
      title: "Memorystick - Legionnaire 738's Memory",
      text: "As soon as you get out of the turret fire, while crossing the plaza, this one is in the door.",
    },
    {
      id: 20,
      title: "Legion Camp",
      text: "At the end of the corridor in the building.",
    },
    {
      id: 21,
      title: "Robot - Document - Promotions - Orca Aerospace Company Production",
      text: "Just to the north of the Legion Camp, before you go through the door into the next area.",
    },
  ];


  useEffect(() => {
    fetchSpaceLogisticsComplexCollectibles();
  }, []);

  const fetchSpaceLogisticsComplexCollectibles = async () => {
    try {
      const data = await getSpaceLogisticsComplex();
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
      <Header id="space-logistics-complex" title="▽ Space Logistics Complex Collectibles" />
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

export default SpaceLogisticsComplex
