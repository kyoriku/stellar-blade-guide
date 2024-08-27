import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getFallenOverpass } from '../../../utils/API/eidos9';

const FallenOverpass = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Locked Supply Chest",
      text: "As soon as you land on Eidos 9, there will be a chest behind the Tetrapod. You'll need to do a sound puzzle to open it.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 158's Memory",
      text: "Once you jump onto the highway, the corpse with the memory stick will be leaning against one of the cars on the right side.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "After destroying the first Cocoon, go through the door and there will be a supply box at the end of the hallway.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Jump over to the next roof and go through the door. Go to the right to find another supply box.",
    },
    {
      id: 5,
      title: "Memorystick - Legionnaire 196's Report",
      text: "From the crate, go the other way and there will be a corpse with the memory stick by the hole in the wall.",
    },
    {
      id: 6,
      title: "Nano Suit - Planet Diving Suit (6th)",
      text: "From the second Cocoon, drop down the yellow ledges and you'll be able to jump over to an island-like area where there will be a Drone Upgrade Module on top of a car. From there, jump across to the building with the pillars. You'll have to swim through the water for a little bit which will slowly kill you, but you'll make it there before you die. Once you're across, climb up to the top from the yellow ledges on the side. Once you're on the roof, jump up to the top and go through the door. The crate will be to the left once you're inside. (If you pre-ordered the game, and already got the nano suit out of the pre-order crate, you'll only get Vitcoins out of this crate instead).",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "Head to the building to the south and into the southeast corner to find more supplies.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Before you head to the objective, where you have to run up the sign, don't. Instead go southwest and jump across the containers in the ocean until you reach the end.",
    },
    {
      id: 9,
      title: "Robot - Document - Promotions - Eidos 9, Of You and Mother",
      text: "There's also a robot here that drops a document.",
    },
    {
      id: 10,
      title: "Legion Camp",
      text: "After killing the first 3 Cocoons, and on your way to the objective, just after Adam tells you there's 6 more, there's a camp on the left.",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "After fighting the Dozer on the highway to the north of the Camp, there's a chest behind the car on the left.",
    },
    {
      id: 12,
      title: "Memorystick - Legionnaire 192's Memory",
      text: "From the previous crate, go across to the other rooftop with the Cocoon and then climb onto the roof to the right. The corpse with the memory stick will be on the right side.",
    },
    {
      id: 13,
      title: "Document - Messages - Ticket to Heaven",
      text: "On the same rooftop, next to the previous memorystick.",
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "Backtrack to the monorail then jump over to the first building you can to the right. Go into the building through the open door and there will be a supply box inside.",
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "Jump over to the parking garage building and there will be a supply box behind the giant AC unit behind the stairs.",
    },
    {
      id: 16,
      title: "Legion Camp",
      text: "From the previous supply box, go downstairs and the camp is at the bottom of the second flight of stairs.",
    },
    {
      id: 17,
      title: "Memorystick - Legionnaire 292's Recollection",
      text: "From the previous camp, go downstairs again and enter the parking garage. The corpse with the memory stick will be directly ahead, against the pillar.",
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "To the left behind the yellow car in the southern corner.",
    },
    {
      id: 19,
      title: "Legion Supply Box",
      text: "Go up a floor in the parking garage and once you reach the fork in the road, go to the left and there will be a crate at the dead end.",
    },
    {
      id: 20,
      title: "Legion Supply Box",
      text: "Once you have to exit the parking garage by the yellow ledges, following the yellow ledges to the right and you'll drop down into a lower part on the first floor of the parking garage with the supply box.",
    },
    {
      id: 21,
      title: "Memorystick - Legionnaire 230's Resignation",
      text: "There's also a memorystick next to the previous supply box.",
    },
    {
      id: 22,
      title: "Legion Supply Box",
      text: "Once you reach the third floor of the parking garage, there will be a crate beside the Hydra enemy.",
    },
    {
      id: 23,
      title: "Memorystick - Legionnaire 207's Request",
      text: "Once at the top of the parking garage, this memorystick will be beside the school bus right by the ramp.",
    },
    {
      id: 24,
      title: "Legion Supply Box",
      text: "Behind the barricade the legionnaire is leaning against is another supply box.",
    },
    {
      id: 25,
      title: "Nano Suit - Punk Top",
      text: "To the south are some tracks. Get on them, head west to the end of the parking garge and then look north. Jump onto the platform around the edge and then make your way down to the surface. The Nano Suit crate is down there.",
    },
    {
      id: 26,
      title: "Memorystick - Legionnaire 282's Memory",
      text: "Jump across to the building south of the parking garage where another Cocoon is located. There will be a flight of stairs behind the Cocoon that will lead to a corpse with the memorystick.",
    },
    {
      id: 27,
      title: "Legion Supply Box",
      text: "Proceed onto the tracks and head southwest. When you see the white rollercoaster track, go up instead of moving toward the Cocoon to reach this supply box.",
    },
  ];


  useEffect(() => {
    fetchFallenOverpassCollectibles();
  }, []);

  const fetchFallenOverpassCollectibles = async () => {
    try {
      const data = await getFallenOverpass();
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
      <Header id="fallen-overpass" title="▽ Fallen Overpass Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default FallenOverpass
