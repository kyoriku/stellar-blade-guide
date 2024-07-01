import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const GreatCanyonContinued = () => {
  const content = [
    {
      id: 1,
      title: "Legion Camp (Eastern Great Canyon)",
      text: "In the south east corner of the area just before you take the elevator down towards Altess Levoire.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/1-Legion Camp-Eastern Great Canyon.1.jpg",
          alt: "Legion Camp (Eastern Great Canyon)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/1-Legion Camp-Eastern Great Canyon.2.jpg",
          alt: "Legion Camp (Eastern Great Canyon)"
        }
      ]
    },
    {
      id: 2,
      title: "Memorystick (Legionnaire 295's Orders)",
      text: "To the left of the lift (slightly west of the Eastern Great Canyon Legion Camp).",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/2-Memorystick-Legionnaire 295's Orders.1.jpg",
          alt: "Memorystick (Legionnaire 295's Orders)"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/2-Memorystick-Legionnaire 295's Orders.2.jpg",
          alt: "Memorystick (Legionnaire 295's Orders)"
        }
      ]
    },
    {
      id: 3,
      title: "Eagle Eye-Type Exospine",
      text: "To the right of the lift that leads down towards the main mission objective.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/3-Eagle Eye-Type Exospine.1.jpg",
          alt: "Eagle Eye-Type Exospine"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/3-Eagle Eye-Type Exospine.2.jpg",
          alt: "Eagle Eye-Type Exospine"
        }
      ]
    },
    {
      id: 4,
      title: "Memorystick (Scavenger 216's Advice)",
      text: "Head southwest from the bottom of the lift to the gate. The human body with with memorystick is there.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/4-Memorystick-Scavenger 216's Advice.1.jpg",
          alt: "Memorystick (Scavenger 216's Advice)"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/4-Memorystick-Scavenger 216's Advice.2.jpg",
          alt: "Memorystick (Scavenger 216's Advice)"
        }
      ]
    },
    {
      id: 5,
      title: "Document - Prayers (Chapter of Trial 6 - S)",
      text: "From the elevator, heading northwest, before the path goes directly west, on the right (east) is a dead end. In that southern wall is a small cave with a shrine in it.",
      images: [
        {
          id: 9,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/5-Document-Prayers-Chapter of Trial 6-S.1.jpg",
          alt: "Document - Prayers (Chapter of Trial 6 - S)"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/5-Document-Prayers-Chapter of Trial 6-S.2.jpg",
          alt: "Document - Prayers (Chapter of Trial 6 - S)"
        }
      ]
    },
    {
      id: 6,
      title: "Body Core",
      text: "As the path bends west, go east and destroy the crates. There's a corpse with a Body Core hidden by said crates.",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/6-Body Core.1.jpg",
          alt: "Body Core"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/6-Body Core.2.jpg",
          alt: "Body Core"
        }
      ]
    },
    {
      id: 7,
      title: "Supply Camp (Altess Levoire Entrance)",
      text: "Directly before the entrance to Altess Levoire.",
      images: [
        {
          id: 13,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/7-Supply Camp-Altess Levoire Entrance.1.jpg",
          alt: "Supply Camp (Altess Levoire Entrance)"
        },
        {
          id: 14,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/7-Supply Camp-Altess Levoire Entrance.2.jpg",
          alt: "Supply Camp (Altess Levoire Entrance)"
        }
      ]
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East of the entrance to Altess Levoire is a gate. Go through it towards the other gate, and then turn north and climb the cliffs to the top. Then, head south and jump over the gap to another set of rocks. There's a chest up there. Inside is an Omnibolt and Fixed Damage Gear (2 star).",
      images: [
        {
          id: 15,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 16,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 17,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.3.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 18,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.4.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 9,
      title: "Document - Series (The Truth, Article 1)",
      text: "Drop down a level and head east to the end where you will see a newspaper dispenser. Interact with it for this document. There's also a Drone Upgrade Module beside it.",
      images: [
        {
          id: 19,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/9-Document-Series-The Truth Article 1.1.jpg",
          alt: "Document - Series (The Truth, Article 1)"
        },
        {
          id: 20,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/9-Document-Series-The Truth Article 1.2.jpg",
          alt: "Document - Series (The Truth, Article 1)"
        }
      ]
    },
    {
      id: 10,
      title: "Nano Suit - Crew Style (NG+ Only)",
      text: "From there, head back west and traverse the cliff on the southwest side. Before you cross the bridge there's a Nano Suit box there, on the right.",
      images: [
        {
          id: 21,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.1.jpg",
          alt: "Nano Suit - Crew Style"
        },
        {
          id: 22,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.2.jpg",
          alt: "Nano Suit - Crew Style"
        },
        {
          id: 23,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.3.jpg",
          alt: "Nano Suit - Crew Style"
        }
      ]
    },
    {
      id: 11,
      title: "Memorystick (Sentinel 65's Testament)",
      text: "Cross the bridge and drop into the courtyard down below.",
      images: [
        {
          id: 24,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/11-Memorystick-Sentinel 65's Testament.1.jpg",
          alt: "Memorystick (Sentinel 65's Testament)"
        },
        {
          id: 25,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/11-Memorystick-Sentinel 65's Testament.2.jpg",
          alt: "Memorystick (Sentinel 65's Testament)"
        }
      ]
    },
    {
      id: 12,
      title: "Can - GrainT Barley",
      text: "Solve the pressure plate puzzle in the same area, by putting all 3 carts on the left-hand pressure plate (so it reads 23 on the left and 3 on the right).",
      images: [
        {
          id: 26,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.1.jpg",
          alt: "Can - GrainT Barley"
        },
        {
          id: 27,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.2.jpg",
          alt: "Can - GrainT Barley"
        },
        {
          id: 28,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.3.jpg",
          alt: "Can - GrainT Barley"
        },
        {
          id: 29,
          src: "/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.4.jpg",
          alt: "Can - GrainT Barley"
        }
      ]
    },
  ];

  return (
    <div>
      <h3 id="great-canyon-continued">Great Canyon Collectibles (Continued)</h3>
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

export default GreatCanyonContinued
