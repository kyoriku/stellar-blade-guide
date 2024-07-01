import React from "react";
import MediaDisplay from "../../../components/Media";

const ScrapYard = () => {
  const content = [
    {
      id: 1,
      title: "Supply Camp (Scrap Yard Entrance)",
      text: "Follow the path down from the northeast and you'll come to a small robot town (Scrap Yard), as well as this Supply Camp.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/5-ScrapYard/1-Supply Camp-Scrap Yard Entrance.1.jpg",
          alt: "Supply Camp (Scrap Yard Entrance)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/5-ScrapYard/1-Supply Camp-Scrap Yard Entrance.2.jpg",
          alt: "Supply Camp (Scrap Yard Entrance)"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "in the northeast corner of the Scrap Yard, but even with a yellow box, the ladder appears not to have collision detection. Come back when you have the Double Jump if you can't get it.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/5-ScrapYard/3-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/5-ScrapYard/3-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "There's another one in the south corner of the area. Climb up and jump over a fence to reach the back wall.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/5-ScrapYard/4-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/5-ScrapYard/4-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Available to purchase from D1G-g2r:",
      text: [
        "2 Weapon Cores",
        "3 Tumbler Expansion Modules",
        "5 Drone Upgrade Modules",
        "3 Omnibolts",
        "Nano Element",
        "Advanced Nano Element",
        "Extreme Nano Element",
        "Document - Information - Service Drones",
        "Document - Series - Plastic Hearts, Vol. 2",
        "Document - Information - Conspiracy",
        "Oval Horn-Rimmed Glasses",
        "Metal-Framed Glasses",
        "Cat's Eye Glasses",
      ],
      images: []
    },
    {
      id: 5,
      title: "D1G-g2r Level 2 Affinity:",
      text: [
        "Brown Horn-Rimmed Glasses",
        "Laboratory Goggles",
        "Polygonal-Framed Glasses",
        "Square-Framed Glasses",
      ],
      images: []
    },
    {
      id: 6,
      title: "D1G-g2r Level 3 Affinity:",
      text: [
        "Classic Round Glasses",
        "Skinny Sunglasses",
        "Orange Aviators",
        "Oversized Sunglasses",
      ],
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.1.jpg",
          alt: "Document - Information - Service Drones"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.2.jpg",
          alt: "Document - Series - Plastic Hearts, Vol. 2"
        },
        {
          id: 9,
          src: "/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.3.jpg",
          alt: "Document - Information - Conspiracy"
        },
      ]
    },
    {
      id: 7,
      title: "Locked Supply Chest",
      text: "Leave D1G-g2r's Scrap Yard and head southeast. Unlock the gate (to open the shortcut) and then unlock the Locked Chest (with the d-pad mini-game).",
      images: [
        {
          id: 10,
          src: "/assets/images/Wasteland/5-ScrapYard/2-Locked Legion Supply Chest.1.jpg",
          alt: "Locked Supply Chest"
        },
        {
          id: 11,
          src: "/assets/images/Wasteland/5-ScrapYard/2-Locked Legion Supply Chest.2.jpg",
          alt: "Locked Supply Chest"
        }
      ]
    },
  ];

  return (
    <div>
      <h3 id="scrap-yard">Scrap Yard Collectibles</h3>
      {content.map((item, index) => {
        const isLastList = index === content.length - 1 || !Array.isArray(content[index + 1].text);
        // const addBottomMargin = item.id === 5;
        return (
          <MediaDisplay
            key={item.id}
            title={item.title}
            text={item.text}
            images={item.images}
            showHr={!Array.isArray(item.text) || isLastList}
          // addBottomMargin={addBottomMargin}
          />
        );
      })}
    </div>
  );
};

export default ScrapYard;
