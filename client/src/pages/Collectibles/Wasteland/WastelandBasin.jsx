import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const WastelandBasin = () => {
  const content = [
    {
      id: 1,
      title: "Memorystick (Sentinel 47's Decision)",
      text: "Carry on south up the hill from the Corrupter Boss Fight.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/6-WastelandBasin/1-Memorystick - Sentinel 47's Decision.1.jpg",
          alt: "Memorystick (Sentinel 47's Decision)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/6-WastelandBasin/1-Memorystick - Sentinel 47's Decision.2.jpg",
          alt: "Memorystick (Sentinel 47's Decision)"
        }
      ]
    },
    {
      id: 2,
      title: "Nano Suit - Holiday Bunny",
      text: "Next to the human body where the memorystick came from is a small box where this Nano Suit can be found.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/6-WastelandBasin/2-Nano Suit - Holiday Bunny.1.jpg",
          alt: "Nano Suit - Holiday Bunny"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/6-WastelandBasin/2-Nano Suit - Holiday Bunny.2.jpg",
          alt: "Nano Suit - Holiday Bunny"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Southwest of the waypoint is a decently sized encampment. Clear the enemies, and then use the batteries on the pressure plates to open the gates. First, the one on the left to free the orange box. Second on the right to free the second battery. Then, put both of the batteries on the plates to open the door. Push the orange box southwest, and use it to get on top of the place where you freed the trapped battery. Has an Omnibolt and Gold Gear inside of it.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/6-WastelandBasin/3-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/6-WastelandBasin/3-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Nano Suit - Cyber Magician",
      text: "Drop down, push the orange box through the main gate and onto the big platform. Then jump up and climb the rope, interact with the chest, and shoot all the targets except the red ones before they disappear. Do that and this nano suit is all yours.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.1.jpg",
          alt: "Nano Suit - Cyber Magician"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.2.jpg",
          alt: "Nano Suit - Cyber Magician"
        },
        {
          id: 9,
          src: "/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.3.jpg",
          alt: "Nano Suit - Cyber Magician"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.4.jpg",
          alt: "Nano Suit - Cyber Magician"
        }
      ]
    },
    {
      id: 5,
      title: "Memorystick (Citizen 290's Prayer)",
      text: "Follow the path west from the waypoint, the memorystick is between the ruined building and the rocky hill.",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/6-WastelandBasin/5-Memorystick - Citizen 290's Prayer.1.jpg",
          alt: "Memorystick (Citizen 290's Prayer)"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/6-WastelandBasin/5-Memorystick - Citizen 290's Prayer.2.jpg",
          alt: "Memorystick (Citizen 290's Prayer)"
        }
      ]
    },
    {
      id: 6,
      title: "Can - Bayern Hefe WeissBier",
      text: "Pull a 180 from the memorystick, and the Fiz machine is straight ahead.",
      images: [
        {
          id: 13,
          src: "/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.1.jpg",
          alt: "Can - Bayern Hefe WeissBier"
        },
        {
          id: 14,
          src: "/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.2.jpg",
          alt: "Can - Bayern Hefe WeissBier"
        },
        {
          id: 15,
          src: "/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.3.jpg",
          alt: "Can - Bayern Hefe WeissBier"
        }
      ]
    },
    {
      id: 7,
      title: "Document - Series (The Truth, Article 5)",
      text: "Continue on the path west from the Fiz machine until you come to a small open-area, on the north side, next to a vending machine, is a blue newspaper dispensary. Interact to get this document.",
      images: [
        {
          id: 16,
          src: "/assets/images/Wasteland/6-WastelandBasin/7-Documents - Series - The Truth Article 5.1.jpg",
          alt: "Document - Series (The Truth, Article 5)"
        },
        {
          id: 17,
          src: "/assets/images/Wasteland/6-WastelandBasin/7-Documents - Series - The Truth Article 5.2.jpg",
          alt: "Document - Series (The Truth, Article 5)"
        }
      ]
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Opposite the previous collectible, behind the ruins to the south.",
      images: [
        {
          id: 18,
          src: "/assets/images/Wasteland/6-WastelandBasin/8-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 19,
          src: "/assets/images/Wasteland/6-WastelandBasin/8-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="wasteland-basin">Wasteland Basin Collectibles</h3>
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

export default WastelandBasin;
