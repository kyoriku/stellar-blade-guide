import React from "react";
import MediaDisplay from "../../../components/Media";

const Plant = () => {
  const content = [
    {
      id: 1,
      title: "Memorystick (Luke's Memory)",
      text: "At the bottom of the water in the middle of the Plant.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/8-Plant/1-Memorystick-Luke's Memory.1.jpg",
          alt: "Memorystick (Luke's Memory)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/8-Plant/1-Memorystick-Luke's Memory.2.jpg",
          alt: "Memorystick (Luke's Memory)"
        }
      ]
    },
    {
      id: 2,
      title: "Memorystick (Go's Memory)",
      text: "Once you pick up the “Incarceration” side quest from the guy in the shipping container, you'll find another corpse in the water. This one with this memorystick.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/8-Plant/2-Memorystick-Go's Memory.1.jpg",
          alt: "Memorystick (Go's Memory)"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/8-Plant/2-Memorystick-Go's Memory.2.jpg",
          alt: "Memorystick (Go's Memory)"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Above the red lights in the middle of the water, on that platform.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/8-Plant/3-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/8-Plant/3-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Can - The Machinetta Cafe Latte",
      text: "Push all three storage trolleys on the pressure plates and this will drop from the crane.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.1.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.2.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        },
        {
          id: 9,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.3.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.4.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        },
        {
          id: 11,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.5.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.6.jpg",
          alt: "Can - The Machinetta Cafe Latte"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="plant">Plant Collectibles</h3>
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

export default Plant
