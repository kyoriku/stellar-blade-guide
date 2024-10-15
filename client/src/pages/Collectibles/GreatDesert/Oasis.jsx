import React from "react";
import CollectiblesSection from "../../../components/CollectiblesSection";

const Oasis = () => {
  const staticContent = [
    {
      id: 1,
      title: "Supply Camp - Oasis",
      text: "On the northern shore of the Oasis pond."
    },
    {
      id: 2,
      title: "Nano Suit - Cybernetic Bondage",
      text: "Just west of the Oasis Supply Camp, underwater, is a locked supply crate Contains the Cybernetic Bondage Nano Suit Design Pattern. Passcode to get in is: yyyya0"
    },
    {
      id: 3,
      title: "Memorystick - Sentinel 55's Decision",
      text: "Northwest of the Oasis Supply Camp, next to some boxes on the ridge of a hill."
    },
    {
      id: 4,
      title: "Memorystick - Harry's Recollection",
      text: "In the southwest corner of the Oasis."
    },
    {
      id: 5,
      title: "Can - Nectar Grape",
      text: "South of the Oasis, near a platform with a cable running to it, is a Fiz machine with this can in."
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "Just slightly south of the aforementioned can."
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "Southwest corner of the Oasis (on the southwest side of the outer wall)."
    },
    {
      id: 8,
      title: "Memorystick - I Felt It",
      text: "Northeast of the Oasis, on top of the Hypertube. Part of the “Let There Be Light Again” side quest."
    },
    {
      id: 9,
      title: "Document - Journals - Damaged Legacy",
      text: "This is dropped by the same person you got the previous memorystick off."
    },
    {
      id: 10,
      title: "Can - The Haven Early Grey",
      text: "Follow the Hypertube all the way east and you'll find the cooler at the end."
    },
    {
      id: 11,
      title: "Memorystick - Sentinel 46's Memory",
      text: "East of the Oasis, before the Buried Ruins, next to a sign sticking out of the sand."
    },
    {
      id: 12,
      title: "Can - Cryo the Malt",
      text: "Just northeast of West of Buried Ruins Legion Camp is a mini-game of sorts. Firstly, you need to shoot a floating target to drop a rope. Second, you need to climb up and power the generator. Thirdly, you need to race to the second and third before the time expires. Do that, and you'll open the garage door below where you end up, which has a can inside."
    },
    {
      id: 13,
      title: "Memorystick - Luthor's Revelation",
      text: "On the rooftop where you hit the final switch for the previous can mini-game."
    },
  ];

  return (
    <CollectiblesSection
      id="oasis"
      title="Oasis"
      level="Great-Desert"
      location="Oasis"
      staticContent={staticContent}
      alwaysShowFinalHr={true}
    />
  );
};

export default Oasis;
