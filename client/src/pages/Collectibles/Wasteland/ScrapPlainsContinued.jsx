import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const ScrapPlainsContinued = () => {
  const content = [
    {
      id: 1,
      title: "Supply Camp (Junkyard)",
      text: "When you get through the wallrunning tutorial as you head south, there'll be a camp on the left.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/1-Supply Camp-Junkyard.1.jpg",
          alt: "Supply Camp (Junkyard)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/1-Supply Camp-Junkyard.2.jpg",
          alt: "Supply Camp (Junkyard)"
        }
      ]
    },
    {
      id: 2,
      title: "Can - Pixie Zero",
      text: "Just nearby the previous one, head to the northern edge and shoot the 3 girders where the drone is. Doing that will cause the drone to fly upwards and dig up a can for you.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.1.jpg",
          alt: "Can - Pixie Zero"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.2.jpg",
          alt: "Can - Pixie Zero"
        },
        {
          id: 5,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.3.jpg",
          alt: "Can - Pixie Zero"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.4.jpg",
          alt: "Can - Pixie Zero"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Northwest of the Junkyard Supply Camp, before you get on the path to the northwest and then northeast, there's a small dead end to the east.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/3-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/3-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Memorystick (Albert's Memory)",
      text: "Follow the path to the top to a load of crates and building materials. This dead body is on the other side of them.",
      images: [
        {
          id: 9,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/4-Memorystick-Albert's Memory.1.jpg",
          alt: "Memorystick (Albert's Memory)"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/4-Memorystick-Albert's Memory.2.jpg",
          alt: "Memorystick (Albert's Memory)"
        }
      ]
    },
    {
      id: 5,
      title: "Memorystick (Aaron's Memory) & Passcode - aSaSaS",
      text: "Hit the button near Albert's body, and then shoot the targets in the same order they appear to unlock where they came from. Down there is Aaron's body (and a passcode for Xion: aSaSaS).",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron's Memory & Passcode for Xion - aSaSaS.1.jpg",
          alt: "Memorystick (Aaron's Memory) & Passcode - aSaSaS"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron's Memory & Passcode for Xion - aSaSaS.2.jpg",
          alt: "Memorystick (Aaron's Memory) & Passcode - aSaSaS"
        },
        {
          id: 13,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron's Memory & Passcode for Xion - aSaSaS.3.jpg",
          alt: "Memorystick (Aaron's Memory) & Passcode - aSaSaS"
        }
      ]
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Southeast of the Junkyard Supply Camp is a chest, near a drone. Code to get in is 0nrrrS.",
      images: [
        {
          id: 14,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/6-Locked Legion Chest.1.jpg",
          alt: "Locked Supply Chest"
        },
        {
          id: 15,
          src: "/assets/images/Wasteland/7-ScrapPlainsCont/6-Locked Legion Chest.2.jpg",
          alt: "Locked Supply Chest"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="scrap-plains-continued">Scrap Plains Collectibles (Continued)</h3>
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

export default ScrapPlainsContinued;
