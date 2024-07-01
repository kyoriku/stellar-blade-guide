import React from "react";
import MediaDisplay from "../../../components/Media";

const BarrenLands = () => {
  const content = [
    {
      id: 1,
      title: "Supply Camp (Hidden Path)",
      text: "As soon as you enter the area. However, you need to restore power at the Solar Tower to use it (side quest, “Reboot”).",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/1-BarrenLands/1-Supply Camp-Hidden Path.1.jpg",
          alt: "Supply Camp (Hidden Path)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/1-BarrenLands/1-Supply Camp-Hidden Path.2.jpg",
          alt: "Supply Camp (Hidden Path)"
        }
      ]
    },
    {
      id: 2,
      title: "Memorystick (Amanda's Memory)",
      text: "From the supply camp, head southwest and there'll be a human corpse as the area opens up a little",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/1-BarrenLands/2-Memorystick-Amanda's Memory.1.jpg",
          alt: "Memorystick (Amanda's Memory)"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/1-BarrenLands/2-Memorystick-Amanda's Memory.2.jpg",
          alt: "Memorystick (Amanda's Memory)"
        }
      ]
    },
    {
      id: 3,
      title: "Memorystick (Donna's Memory)",
      text: "The corpse next to the previous memorystick is actually part of the “Missing Wife” Request. Interact to get this memorystick.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/1-BarrenLands/3-Memorystick-Donna's Memory.1.jpg",
          alt: "Memorystick (Donna's Memory)"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/1-BarrenLands/3-Memorystick-Donna's Memory.2.jpg",
          alt: "Memorystick (Donna's Memory)"
        }
      ]
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Just slightly southwest from the previous memorysticks.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/1-BarrenLands/4-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/1-BarrenLands/4-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 5,
      title: "Robot - Document - Series (The Xion #2)",
      text: "East of the supply camp is a robot who drops this document.",
      images: [
        {
          id: 9,
          src: "/assets/images/Wasteland/1-BarrenLands/5-Robot-Documents-Series-The Xion 2.1.jpg",
          alt: "Robot - Documents - Series (The Xion #2)"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/1-BarrenLands/5-Robot-Documents-Series-The Xion 2.2.jpg",
          alt: "Robot - Documents - Series (The Xion #2)"
        }
      ]
    },
    {
      id: 6,
      title: "Memorystick (Citizen 439's Resignation)",
      text: "Southeast of the Hidden Path supply camp is a large dead tree with a human corpse at its base.",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/1-BarrenLands/6-Memorystick-Citizen 439's Resignation.1.jpg",
          alt: "Memorystick (Citizen 439's Resignation)"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/1-BarrenLands/6-Memorystick-Citizen 439's Resignation.2.jpg",
          alt: "Memorystick (Citizen 439's Resignation)"
        }
      ]
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "East of the previous memorystick.",
      images: [
        {
          id: 13,
          src: "/assets/images/Wasteland/1-BarrenLands/7-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 14,
          src: "/assets/images/Wasteland/1-BarrenLands/7-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 8,
      title: "Memorystick (Sentinel 78's Consolation)",
      text: "Just slightly southeast of the waypoint, behind a massive steel girder.",
      images: [
        {
          id: 15,
          src: "/assets/images/Wasteland/1-BarrenLands/9-Memorystick-Sentinel 78's Consolation.1.jpg",
          alt: "Memorystick (Sentinel 78's Consolation)"
        },
        {
          id: 16,
          src: "/assets/images/Wasteland/1-BarrenLands/9-Memorystick-Sentinel 78's Consolation.2.jpg",
          alt: "Memorystick (Sentinel 78's Consolation)"
        }
      ]
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "Not far south from the Waypoint (northeast of the Barren Land Legion Camp).",
      images: [
        {
          id: 17,
          src: "/assets/images/Wasteland/1-BarrenLands/10-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 18,
          src: "/assets/images/Wasteland/1-BarrenLands/10-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 10,
      title: "Legion Camp (Barren Land)",
      text: "Southwest of the previous supply box is the Barren Land Legion Camp.",
      images: [
        {
          id: 19,
          src: "/assets/images/Wasteland/1-BarrenLands/11-Legion Camp.1.jpg",
          alt: "Legion Camp"
        },
        {
          id: 20,
          src: "/assets/images/Wasteland/1-BarrenLands/11-Legion Camp.2.jpg",
          alt: "Legion Camp"
        }
      ]
    },
    {
      id: 11,
      title: "Memorystick (Scavenger 160's Advice)",
      text: "Just northwest of the Barren Land Legion Camp is a Hedgeboar by two corpses.",
      images: [
        {
          id: 21,
          src: "/assets/images/Wasteland/1-BarrenLands/12-Memorystick-Scavenger 160's Advice.1.jpg",
          alt: "Memorystick (Scavenger 160's Advice)"
        },
        {
          id: 22,
          src: "/assets/images/Wasteland/1-BarrenLands/12-Memorystick-Scavenger 160's Advice.2.jpg",
          alt: "Memorystick (Scavenger 160's Advice)"
        }
      ]
    },
    {
      id: 12,
      title: "Memorystick (Scavenger 102's Decision)",
      text: "The other corpse is next to the previous Memorystick.",
      images: [
        {
          id: 23,
          src: "/assets/images/Wasteland/1-BarrenLands/13-Memorystick-Scavenger 102's Decision.1.jpg",
          alt: "Memorystick (Scavenger 102's Decision)"
        },
        {
          id: 24,
          src: "/assets/images/Wasteland/1-BarrenLands/13-Memorystick-Scavenger 102's Decision.2.jpg",
          alt: "Memorystick (Scavenger 102's Decision)"
        }
      ]
    },
    {
      id: 13,
      title: "Memorystick (Legionnaire 311's Resolution)",
      text: "Slumped up against the west side of the Solar Tower.",
      images: [
        {
          id: 25,
          src: "/assets/images/Wasteland/1-BarrenLands/14-Memorystick-Legionnaire 311's Resolution.1.jpg",
          alt: "Memorystick (Legionnaire 311's Resolution)"
        },
        {
          id: 26,
          src: "/assets/images/Wasteland/1-BarrenLands/14-Memorystick-Legionnaire 311's Resolution.2.jpg",
          alt: "Memorystick (Legionnaire 311's Resolution)"
        }
      ]
    },
    {
      id: 14,
      title: "Camouflage-Type Exospine",
      text: "At the top of the Solar Tower, in the western area of the Wasteland.",
      images: [
        {
          id: 27,
          src: "/assets/images/Wasteland/1-BarrenLands/15-Camouflage-Type Exospine.1.jpg",
          alt: "Camouflage-Type Exospine"
        },
        {
          id: 28,
          src: "/assets/images/Wasteland/1-BarrenLands/15-Camouflage-Type Exospine.2.jpg",
          alt: "Camouflage-Type Exospine"
        }
      ]
    },
    {
      id: 15,
      title: "Memorystick (Legionnaire 323's Warning)",
      text: "West of the Solar Tower is a body, at the base of a billboard.",
      images: [
        {
          id: 29,
          src: "/assets/images/Wasteland/1-BarrenLands/16-Memorystick-Legionnaire 323's Warning.1.jpg",
          alt: "Memorystick (Legionnaire 323's Warning)"
        },
        {
          id: 30,
          src: "/assets/images/Wasteland/1-BarrenLands/16-Memorystick-Legionnaire 323's Warning.2.jpg",
          alt: "Memorystick (Legionnaire 323's Warning)"
        }
      ]
    },
    {
      id: 16,
      title: "Can - Potential Tempest",
      text: "Turn on 2 consoles in the area north of the Solar Tower, then push the yellow box to the shipping container in the middle of the area to turn on the final console. The chest next to it will open, which has this can inside.",
      images: [
        {
          id: 31,
          src: "/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.1.jpg",
          alt: "Can - Potential Tempest"
        },
        {
          id: 32,
          src: "/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.2.jpg",
          alt: "Can - Potential Tempest"
        },
        {
          id: 33,
          src: "/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.3.jpg",
          alt: "Can - Potential Tempest"
        },
        {
          id: 34,
          src: "/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.4.jpg",
          alt: "Can - Potential Tempest"
        },
        {
          id: 35,
          src: "/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.5.jpg",
          alt: "Can - Potential Tempest"
        }
      ]
    },
    {
      id: 17,
      title: "Memorystick (The Search for a Haven)",
      text: "Head northeast of the Solar Tower and climb the cliffs up to the large open area to the northwest. There's a corpse at the entrance.",
      images: [
        {
          id: 36,
          src: "/assets/images/Wasteland/1-BarrenLands/18-Memorystick-The Search for a Haven.1.jpg",
          alt: "Memorystick (The Search for a Haven)"
        },
        {
          id: 37,
          src: "/assets/images/Wasteland/1-BarrenLands/18-Memorystick-The Search for a Haven.2.jpg",
          alt: "Memorystick (The Search for a Haven)"
        }
      ]
    },
    {
      id: 18,
      title: "Lily Outfit (Rainy Day)",
      text: "North of the previous memorystick, in the haven. Underwater. Ignore the other chest for now (the locked one), as that's part of another quest later on when you have the Fishing Rod.",
      images: [
        {
          id: 38,
          src: "/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.1.jpg",
          alt: "Lily Outfit (Rainy Day)"
        },
        {
          id: 39,
          src: "/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.2.jpg",
          alt: "Lily Outfit (Rainy Day)"
        },
        {
          id: 40,
          src: "/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.3.jpg",
          alt: "Lily Outfit (Rainy Day)"
        }
      ]
    },
    {
      id: 19,
      title: "Nano Suit - Racer's High",
      text: "Head back out from the haven, go east and drop down onto the rocks for this Nano Suit.",
      images: [
        {
          id: 41,
          src: "/assets/images/Wasteland/1-BarrenLands/20-Nano Suit-Racer's High.1.jpg",
          alt: "Nano Suit - Racer's High"
        },
        {
          id: 42,
          src: "/assets/images/Wasteland/1-BarrenLands/20-Nano Suit-Racer's High.2.jpg",
          alt: "Nano Suit - Racer's High"
        }
      ]
    },
    {
      id: 20,
      title: "Supply Camp (Solar Tower Entrance)",
      text: "You'll find this camp east of the Solar Tower.",
      images: [
        {
          id: 43,
          src: "/assets/images/Wasteland/1-BarrenLands/21-Supply Camp-Solar Tower Entrance.1.jpg",
          alt: "Supply Camp (Solar Tower Entrance)"
        },
        {
          id: 44,
          src: "/assets/images/Wasteland/1-BarrenLands/21-Supply Camp-Solar Tower Entrance.2.jpg",
          alt: "Supply Camp (Solar Tower Entrance)"
        }
      ]
    },
    {
      id: 21,
      title: "Memorystick (Marco's Recollection)",
      text: "Just to the northeast of the Supply Camp is a human corpse with this memorystick.",
      images: [
        {
          id: 45,
          src: "/assets/images/Wasteland/1-BarrenLands/22-Memorystick-Marco's Recollection.1.jpg",
          alt: "Memorystick (Marco's Recollection)"
        },
        {
          id: 46,
          src: "/assets/images/Wasteland/1-BarrenLands/22-Memorystick-Marco's Recollection.2.jpg",
          alt: "Memorystick (Marco's Recollection)"
        }
      ]
    },
    {
      id: 22,
      title: "Robot (Mind Map Copy)",
      text: "Southeast of the Barren Land Legion Camp is a robot with a Mind Map Copy inside. Part of Su and Enya's side quest, “Looking At You.”",
      images: [
        {
          id: 47,
          src: "/assets/images/Wasteland/1-BarrenLands/23-Robot-Mind Map Copy.1.jpg",
          alt: "Robot - Mind Map Copy"
        },
        {
          id: 48,
          src: "/assets/images/Wasteland/1-BarrenLands/23-Robot-Mind Map Copy.2.jpg",
          alt: "Robot - Mind Map Copy"
        }
      ]
    },
    {
      id: 23,
      title: "Robot (Mind Map Copy)",
      text: "East of the Hidden Path Supply Camp is a path that leads to a dead end. It's heavily guarded, and has a robot in the middle. Part of Su and Enya's side quest, “Looking At You.”",
      images: [
        {
          id: 49,
          src: "/assets/images/Wasteland/1-BarrenLands/24-Robot-Mind Map Copy.1.jpg",
          alt: "Robot - Mind Map Copy"
        },
        {
          id: 50,
          src: "/assets/images/Wasteland/1-BarrenLands/24-Robot-Mind Map Copy.2.jpg",
          alt: "Robot - Mind Map Copy"
        }
      ]
    },
    {
      id: 24,
      title: "Impact-Type Exospine",
      text: "Defeat the three waves of enemies in the small arena to the north of the Robot and you'll find this in the case at the end.",
      images: [
        {
          id: 51,
          src: "/assets/images/Wasteland/1-BarrenLands/26-Impact-Type Exospine.1.jpg",
          alt: "Impact-Type Exospine"
        },
        {
          id: 52,
          src: "/assets/images/Wasteland/1-BarrenLands/26-Impact-Type Exospine.2.jpg",
          alt: "Impact-Type Exospine"
        }
      ]
    },
    {
      id: 25,
      title: "Memorystick (Scavenger 248's Despair)",
      text: "South of the previous area. On the cliffs to the west.",
      images: [
        {
          id: 53,
          src: "/assets/images/Wasteland/1-BarrenLands/27-Memorystick-Scavenger 248's Despair.1.jpg",
          alt: "Memorystick (Scavenger 248's Despair)"
        },
        {
          id: 54,
          src: "/assets/images/Wasteland/1-BarrenLands/27-Memorystick-Scavenger 248's Despair.2.jpg",
          alt: "Memorystick (Scavenger 248's Despair)"
        }
      ]
    },
    {
      id: 26,
      title: "Legion Supply Box",
      text: "East of the previous memorystick. At the end of a small dead end.",
      images: [
        {
          id: 55,
          src: "/assets/images/Wasteland/1-BarrenLands/28-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 56,
          src: "/assets/images/Wasteland/1-BarrenLands/28-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 27,
      title: "Memorystick (Sentinel 82's Report)",
      text: "South of the previous supply crate, just jump down the cliff and it's by an enemy or two.",
      images: [
        {
          id: 57,
          src: "/assets/images/Wasteland/1-BarrenLands/30-Memorystick-Sentinel 82's Report.1.jpg",
          alt: "Memorystick (Sentinel 82's Report)"
        },
        {
          id: 58,
          src: "/assets/images/Wasteland/1-BarrenLands/30-Memorystick-Sentinel 82's Report.2.jpg",
          alt: "Memorystick (Sentinel 82's Report)"
        }
      ]
    },
    {
      id: 28,
      title: "Memorystick (Scavenger 131's Memory)",
      text: "South of the previous memorystick, in the southeast corner of the dead end area.",
      images: [
        {
          id: 59,
          src: "/assets/images/Wasteland/1-BarrenLands/29-Memorystick-Scavenger 131's Memory.1.jpg",
          alt: "Memorystick (Scavenger 131's Memory)"
        },
        {
          id: 60,
          src: "/assets/images/Wasteland/1-BarrenLands/29-Memorystick-Scavenger 131's Memory.2.jpg",
          alt: "Memorystick (Scavenger 131's Memory)"
        }
      ]
    },
    {
      id: 29,
      title: "Can - GrainT Corn",
      text: "On the eastern path from the previous items (the path that leads to Altess Levoire)",
      images: [
        {
          id: 61,
          src: "/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.1.jpg",
          alt: "Can - GrainT Corn"
        },
        {
          id: 62,
          src: "/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.2.jpg",
          alt: "Can - GrainT Corn"
        },
        {
          id: 63,
          src: "/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.3.jpg",
          alt: "Can - GrainT Corn"
        }
      ]
    },
  ];

  return (
    <div>
      <h3 id="barren-lands">Barren Lands Collectibles</h3>
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

export default BarrenLands;
