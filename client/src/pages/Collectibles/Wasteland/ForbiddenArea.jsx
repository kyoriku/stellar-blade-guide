import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const ForbiddenArea = () => {
  const content = [
    {
      id: 1,
      title: "Can - Cryo The Clear",
      text: "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the “Life of the Scavengers” side quest.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.1.jpg",
          alt: "Can - Cryo The Clear"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.2.jpg",
          alt: "Can - Cryo The Clear"
        },
        {
          id: 3,
          src: "/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.3.jpg",
          alt: "Can - Cryo The Clear"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.4.jpg",
          alt: "Can - Cryo The Clear"
        },
        {
          id: 5,
          src: "/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.5.jpg",
          alt: "Can - Cryo The Clear"
        }
      ]
    },
    {
      id: 2,
      title: "Memorystick (Tommy's Testament)",
      text: "Interact with Tommy's body after defeating the Brute.",
      images: [
        {
          id: 6,
          src: "/assets/images/Wasteland/10-ForbiddenArea/3-Memorystick-Tommy's Testament.1.jpg",
          alt: "Memorystick (Tommy's Testament)"
        },
        {
          id: 7,
          src: "/assets/images/Wasteland/10-ForbiddenArea/3-Memorystick-Tommy's Testament.2.jpg",
          alt: "Memorystick (Tommy's Testament)"
        }
      ]
    },
    {
      id: 3,
      title: "Nano Suit - Sporty Yellow",
      text: "In a chest where the Brute came from in the Forbidden Area. Directly behind Tommy's body.",
      images: [
        {
          id: 8,
          src: "/assets/images/Wasteland/10-ForbiddenArea/4-Sporty Yellow Nano Suit.1.jpg",
          alt: "Nano Suit - Sporty Yellow"
        },
        {
          id: 9,
          src: "/assets/images/Wasteland/10-ForbiddenArea/4-Sporty Yellow Nano Suit.2.jpg",
          alt: "Nano Suit - Sporty Yellow"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="forbidden-area">Forbidden Area Collectibles</h3>
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

export default ForbiddenArea
