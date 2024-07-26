import React, { useEffect, useState } from "react";

import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";

import { getSilentStreet } from "../../../utils/API/eidos7";

const SilentStreet = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Passcode - r0ar0a",
      text: "In the first garage/storage room on the left on Silent Street, where the Creepers crash out of the wall.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 451's Resolution",
      text: "After going through the gate, climb up to the right and follow that path to the end for this collectible.",
    },
    {
      id: 3,
      title: "Robot - Tumbler Expansion Module",
      text: "Southeast from where you are, follow the alleyway to the end and there'll be a robot there to destroy for loot.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "In the water after passing through the gate.",
    },
    {
      id: 5,
      title: "Legion Camp",
      text: "Back on Silent Street, down there on the left, near to where you just went swimming",
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "To the left of the bridge in a garage, before going across, where you fight your first Cricket Slasher - hit the car and loot the for the Micro Drive.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "To the left, when you're halfway across the bridge. Jump over the gap to reach the rooftops and follow to the back.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "To the left of the bridge, drop down, kill the two Cricket Slashers and then the Hydra and open the box to the north. Inside is an Omnibolt, the Combo Attack Enhancement Gear (+14%).",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "To the right after the bridge, near where the Scan tutorial. Climb up near the scaffolding on the right hand side of the road to the top.",
    },
    {
      id: 10,
      title: "Beta Core",
      text: "After the ambush with the Mutated Creeper, Creepers and finally the Heavy Guardian, head down the alley to the north-northeast corner and follow it round to the left. There, near a Guardian, is the Beta Core (needed to upgrade your max beta energy).",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Where the ambush took place, head up to the top of the building in the southeast, using the yellow ledges on the southeast wall.",
    },
    {
      id: 12,
      title: "Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r",
      text: "Head the correct way after the ambush, and as you get onto the balcony, and before you grab onto the poles, there's a corpse on your left with this passcode and memorystick.",
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "In the caged off area in the water section with the ladder. There's a hole in the fence you can use to get in.",
    },
    {
      id: 14,
      title: "Memorystick - Louis's Testimony",
      text: "In the same area as the water and the ladder, climb up the yellow ledges on the northwest wall of the building at the far end. There's a human corpse on the roof.",
    },
    {
      id: 15,
      title: "Legion Camp",
      text: "Up the ladder from the water will be a camp straight ahead.",
    },
    {
      id: 16,
      title: "Locked Legion Chest",
      text: "From the camp, head down the ladder and go west to Barker Drugs. The chest is in there.",
    },
    {
      id: 17,
      title: "Memorystick - Lament of Despair",
      text: "On a corpse in the back of the same room as the locked chest",
    },
    {
      id: 18,
      title: "Document - Series - Plastic Hearts, Volume 3",
      text: "After heading through the door (using the Fusion Cell), head left, defeat the Barnacle, and this document is a book on the shelf in the southeast corner.",
    },
  ];

  useEffect(() => {
    fetchSilentStreetCollectibles();
  }, []);

  const fetchSilentStreetCollectibles = async () => {
    try {
      const data = await getSilentStreet();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const shouldRenderHr = (index) => {
    if (isLoading) return index < staticContent.length - 1;
    return index < staticContent.length - 1;
  };

  return (
    <div>
      <hr id="silent-street" />
      <h3>▽ Silent Street Collectibles</h3>
      <hr className="w-75" />
      {error && <p className="error-message">{error}</p>}
      {staticContent.map((item, index) => (
        <div key={item.id}>
          <ContentText title={item.title} text={item.text} />
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <MediaDisplay images={content.find((data) => data.id === item.id)?.images || []} />
          )}
          <HrComponent index={index} isLoading={isLoading} length={staticContent.length} />
        </div>
      ))}
    </div>
  );
};

export default SilentStreet;
