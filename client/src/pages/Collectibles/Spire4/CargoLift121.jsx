import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getCargoLift121 } from '../../../utils/API/spire4';

const CargoLift121 = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: " On the left as you enter the lift.",
    },
    {
      id: 2,
      title: "Robot - Tumbler Expansion Module",
      text: "Push the yellow crate up to the blue crate near it and climb to the top. Follow it northwest to this robot",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "In the southwest corner, on the ground level.",
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 759's Resignation",
      text: "From the supply box turn around and go in that hole in the side of the storage. Move one of the yellow crates on the right so you can get through the hole in the wall, where the Legion is.",
    },
    {
      id: 5,
      title: "Locked Supply Chest",
      text: "In the northwest corner, under the stairs, push the yellow box forward so you can climb over.",
    },
    {
      id: 6,
      title: "Body Core",
      text: "Go out through the door at the top, take a left, and go to the top of the stairs. Instead of going left, go down the lift. The body is under the stairs.",
    },
    {
      id: 7,
      title: "Glasses - Large Round",
      text: "Climb the elevator shaft to the top and go all the way to the northeast and drop down. The glasses are inside that box.",
    },
    {
      id: 8,
      title: "Memorystick - Legionnaire 761's Request",
      text: "Go back up the lift and carry on to the objective. This one is right in the next room off the previous corridor.",
    },
    {
      id: 9,
      title: "Memorystick - Legionnaire 760's Memory",
      text: "Head through the first Machine Hive and then head northeast through the next one. The body is behind the second one.",
    },
    {
      id: 10,
      title: "Memorystick - Legionnaire 743's Shock",
      text: "Head further in and you'll come across the body with this memorystick.",
    },
    {
      id: 11,
      title: "Memorystick - John's Retrospection",
      text: "Go round the corner, start a fight on the 2 Lumps, and another will join in behind you., there's another body under the staircase.",
    },
    {
      id: 12,
      title: "Memorystick - Legionnaire 719's Memory",
      text: "Return to where that third Lump came from and you'll find this memorystick.",
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "Head southeast and round the corner to the right. The chest is there.",
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "Head up the stairs in the previous room and jump onto the containers. Then, go through the gaps in the southwest wall and head to the far south for this chest. Contains Omnibolt and Burst Enhancement Gear.",
    },    
  ];


  useEffect(() => {
    fetchCargoLift121Collectibles();
  }, []);

  const fetchCargoLift121Collectibles = async () => {
    try {
      const data = await getCargoLift121();
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
      <Header id="cargo-lift-121" title="▽ Cargo Lift 121 Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default CargoLift121
