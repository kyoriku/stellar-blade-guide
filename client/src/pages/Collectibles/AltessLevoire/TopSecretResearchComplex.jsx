import React from "react";
import MediaDisplay from "../../../components/Media";

const TopSecretResearchComplex = () => {
  const content = [
    {
      id: 1,
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right.",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/12-Legion Camp.jpg",
          alt: "Legion Camp"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "After you beat the ambush and make it up the lift.",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/13-Legion Camp.jpg",
          alt: "Legion Camp"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Chest",
      text: "Once you've cleared the monster covering the walkway, there's a cache before you move into the next room.",
      images: [
        {
          id: 3,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/14-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    },
    {
      id: 4,
      title: "Passcode - unyaun",
      text: "Head past the locked door that needs a keycode, go through the door with the green light next to it, and then there'll be a body on the right down there with a passcode.",
      images: [
        {
          id: 4,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/15-Passcode - unyaun.jpg",
          alt: "Passcode - unyaun"
        }
      ]
    },
    {
      id: 5,
      title: "Legion Supply Chest",
      text: "Carry on to the end of the corridor until you reach a door. Inside is a dead end, but also a Legion Supply Box.",
      images: [
        {
          id: 5,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/16-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    },
    {
      id: 6,
      title: "Locked Legion Supply Box",
      text: "On the walkway between fans, after doing the fan set-piece. It needs the Hacking Tool, but don't worry if you don't have it, as it's just a lot of Nano Elements.",
      images: [
        {
          id: 6,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/17-Locked Legion Supply Box.jpg",
          alt: "Locked Legion Supply Box"
        }
      ]
    },
    {
      id: 7,
      title: "Legion Supply Chest",
      text: "By the next set of ladders up (d-pad mini-game inbound!).",
      images: [
        {
          id: 7,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/18-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    },
    {
      id: 8,
      title: "Robot - Tumbler Expansion Module",
      text: "Up the next ladder, and then do a 180 and hop over the barrier. There you'll find a robot.",
      images: [
        {
          id: 8,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/19-Robot - Tumbler Expansion Module.jpg",
          alt: "Robot - Tumbler Expansion Module"
        }
      ]
    },
    {
      id: 9,
      title: "Supply Camp",
      text: "Next to both sets of ladders.",
      images: [
        {
          id: 9,
          src: "/assets/images/AltessLevoire/4-TopSecretResearchComplex/20-Supply Camp.jpg",
          alt: "Supply Camp"
        }
      ]
    }
  ];

  return (
    <div>
      <hr id="top-secret-research-complex"></hr>
      <h3 >▽ Top Secret Research Complex Collectibles</h3>
      <hr className='w-75'></hr>
      {content.map((item) => (
        <MediaDisplay
          key={item.id}
          title={item.title}
          text={item.text}
          images={item.images}
          showHr={item.text}
        />
      ))}
    </div>
  );
}

export default TopSecretResearchComplex
