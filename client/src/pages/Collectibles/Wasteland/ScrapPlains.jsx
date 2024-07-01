import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const ScrapPlains = () => {
  const content = [
    {
      id: 1,
      title: "Supply Camp (Central Scrap Plains)",
      text: "As soon as you enter the Scrap Plains from the Barren Lands.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/3-ScrapPlains/1-Supply Camp-Central Scrap Plains.1.jpg",
          alt: "Supply Camp (Central Scrap Plains)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/3-ScrapPlains/1-Supply Camp-Central Scrap Plains.2.jpg",
          alt: "Supply Camp (Central Scrap Plains)"
        }
      ]
    },
    {
      id: 2,
      title: "Document - Log Data - S2RV1C2-7812's Data",
      text: "Southeast of the supply camp is a small yellow droid. Interact with it to unlock this log.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/3-ScrapPlains/2-Document-Log Data-S2RV1C2-7812's Data.1.jpg",
          alt: "Document - Log Data (S2RV1C2-7812's Data)"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/3-ScrapPlains/2-Document-Log Data-S2RV1C2-7812's Data.2.jpg",
          alt: "Document - Log Data (S2RV1C2-7812's Data)"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Further southeast of the previous document. Inside a shipping container near the edge of the cliff.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/3-ScrapPlains/3-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/3-ScrapPlains/3-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Locked Legion Supply Box",
      text: "South of the previous Supply Box, in a small area that you can get to by heading west from the previous supply box. Shoot the barrels to free the box from tar. Need the Hacking Tool to unlock.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/3-ScrapPlains/4-Locked Legion Supply Box.1.jpg",
          alt: "Locked Legion Supply Box"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/3-ScrapPlains/4-Locked Legion Supply Box.2.jpg",
          alt: "Locked Legion Supply Box"
        }
      ]
    },
    {
      id: 5,
      title: "Beta Core",
      text: "Head east from the last lot of collectibles to the building by the scrap piles. In the middle of the scrap piles is a human corpse with this Beta Core.",
      images: [
        {
          id: 9,
          src: "/assets/images/Wasteland/3-ScrapPlains/5-Beta Core.1.jpg",
          alt: "Beta Core"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/3-ScrapPlains/5-Beta Core.2.jpg",
          alt: "Beta Core"
        }
      ]
    },
    {
      id: 6,
      title: "Document - Messages - Do Not Disturb",
      text: "On the front of the building east of the previous collectible. Near the ladder.",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/3-ScrapPlains/6-Document-Messages-Do Not Disturb.1.jpg",
          alt: "Document - Messages (Do Not Disturb)"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/3-ScrapPlains/6-Document-Messages-Do Not Disturb.2.jpg",
          alt: "Document - Messages (Do Not Disturb)"
        }
      ]
    },
    {
      id: 7,
      title: "Legion Camp (Bus Stop)",
      text: "Northeast of the previous shack is a literal bus stop which doubles up as a camp.",
      images: [
        {
          id: 13,
          src: "/assets/images/Wasteland/3-ScrapPlains/7-Legion Camp-Bus Stop.1.jpg",
          alt: "Legion Camp (Bus Stop)"
        },
        {
          id: 14,
          src: "/assets/images/Wasteland/3-ScrapPlains/7-Legion Camp-Bus Stop.2.jpg",
          alt: "Legion Camp (Bus Stop)"
        }
      ]
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East of the Bus Stop, in a container. Contains Ranged Enhancement Gear and 1 Omnibolt.",
      images: [
        {
          id: 15,
          src: "/assets/images/Wasteland/3-ScrapPlains/8-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 16,
          src: "/assets/images/Wasteland/3-ScrapPlains/8-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 9,
      title: "Robot - Passcode - rB0aya",
      text: "Southeast of the bus stop are some ruins with a robot inside.",
      images: [
        {
          id: 17,
          src: "/assets/images/Wasteland/3-ScrapPlains/9-Robot-Passcode-rB0aya.1.jpg",
          alt: "Robot - Passcode (rB0aya)"
        },
        {
          id: 18,
          src: "/assets/images/Wasteland/3-ScrapPlains/9-Robot-Passcode-rB0aya.2.jpg",
          alt: "Robot - Passcode (rB0aya)"
        }
      ]
    },
    {
      id: 10,
      title: "Robot (2x Drone Upgrade Modules)",
      text: "South-southeast of the bus stop, all the way down to the end of the level is a broken highway. Get on the highway and the robot is to the far south (watch out for the turret though).",
      images: [
        {
          id: 19,
          src: "/assets/images/Wasteland/3-ScrapPlains/11-Robot-2x Drone Upgrade Modules.1.jpg",
          alt: "Robot (2x Drone Upgrade Modules)"
        },
        {
          id: 20,
          src: "/assets/images/Wasteland/3-ScrapPlains/11-Robot-2x Drone Upgrade Modules.2.jpg",
          alt: "Robot (2x Drone Upgrade Modules)"
        }
      ]
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Go up and to the east from the Waypoint, climbing towards the top. On the way you'll pass a crate.",
      images: [
        {
          id: 21,
          src: "/assets/images/Wasteland/3-ScrapPlains/12-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 22,
          src: "/assets/images/Wasteland/3-ScrapPlains/12-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 12,
      title: "Beta Core",
      text: "Keep climbing to the top (above the Waypoint), and there's a body with a Beta Core on the edge.",
      images: [
        {
          id: 23,
          src: "/assets/images/Wasteland/3-ScrapPlains/13-Beta Core.1.jpg",
          alt: "Beta Core"
        },
        {
          id: 24,
          src: "/assets/images/Wasteland/3-ScrapPlains/13-Beta Core.2.jpg",
          alt: "Beta Core"
        }
      ]
    },
    {
      id: 13,
      title: "Locked Supply Chest",
      text: "Now head northeast from up top and out the back of the collapsed buildings. Contains 5x Drone Upgrade Modules.",
      images: [
        {
          id: 25,
          src: "/assets/images/Wasteland/3-ScrapPlains/14-Locked Legion Supply Chest.1.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 26,
          src: "/assets/images/Wasteland/3-ScrapPlains/14-Locked Legion Supply Chest.2.jpg",
          alt: "Locked Legion Supply Chest"
        }
      ]
    },
    {
      id: 14,
      title: "Memorystick (Sentinel 90's Resignation)",
      text: "Back west of the bus stop (northeast of the Central Scrap Plains).",
      images: [
        {
          id: 27,
          src: "/assets/images/Wasteland/3-ScrapPlains/15-Memorystick-Sentinel 90's Resignation.1.jpg",
          alt: "Memorystick (Sentinel 90's Resignation)"
        },
        {
          id: 28,
          src: "/assets/images/Wasteland/3-ScrapPlains/15-Memorystick-Sentinel 90's Resignation.2.jpg",
          alt: "Memorystick (Sentinel 90's Resignation)"
        }
      ]
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "Northwest of the Central Scrap Plains Supply Camp, under a small shelter by the cliff face.",
      images: [
        {
          id: 29,
          src: "/assets/images/Wasteland/3-ScrapPlains/17-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 30,
          src: "/assets/images/Wasteland/3-ScrapPlains/17-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 16,
      title: "Legion Supply Box",
      text: "Southwest of the Waypoint, up the slope, near a large generator.",
      images: [
        {
          id: 31,
          src: "/assets/images/Wasteland/3-ScrapPlains/19-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 32,
          src: "/assets/images/Wasteland/3-ScrapPlains/19-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 17,
      title: "Robot - Passcode - uyKLaB",
      text: "As you keep heading up past the two turrets from below, look southwest and there'll be a robot there.",
      images: [
        {
          id: 33,
          src: "/assets/images/Wasteland/3-ScrapPlains/20-Robot-Passcode-uyKLaB.1.jpg",
          alt: "Robot - Passcode (uyKLaB)"
        },
        {
          id: 34,
          src: "/assets/images/Wasteland/3-ScrapPlains/20-Robot-Passcode-uyKLaB.2.jpg",
          alt: "Robot - Passcode (uyKLaB)"
        }
      ]
    },
    {
      id: 18,
      title: "Legion Supply Box",
      text: "Right behind the robot.",
      images: [
        {
          id: 35,
          src: "/assets/images/Wasteland/3-ScrapPlains/21-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 36,
          src: "/assets/images/Wasteland/3-ScrapPlains/21-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 19,
      title: "Locked Supply Chest",
      text: "You need to destroy all the red drones working on the towers (and turn the power on down the button) in the same area as the other two. Once done, the door will open on the shack at the top of the hill. Contains 2 WB Pumps.",
      images: [
        {
          id: 37,
          src: "/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.1.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 38,
          src: "/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.2.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 39,
          src: "/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.3.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 40,
          src: "/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.4.jpg",
          alt: "Locked Legion Supply Chest"
        }
      ]
    },
    {
      id: 20,
      title: "Can - Corsair Lager",
      text: "Northwest of the Waypoint is a yellow structure. The crate is up high. Head to the north of that dead end from where you are. At the top is a level that drops one of the platforms on a timer. Pull the lever, race back, avoid the two turrets, and the chest is all yours.",
      images: [
        {
          id: 41,
          src: "/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.1.jpg",
          alt: "Can - Corsair Lager"
        },
        {
          id: 42,
          src: "/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.2.jpg",
          alt: "Can - Corsair Lager"
        },
        {
          id: 43,
          src: "/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.3.jpg",
          alt: "Can - Corsair Lager"
        },
        {
          id: 44,
          src: "/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.4.jpg",
          alt: "Can - Corsair Lager"
        }
      ]
    },
    {
      id: 21,
      title: "Locked Supply Chest",
      text: "North of the Waypoint, jump on the yellow bus and onto the back of the monorail. Contains 4x Bionic Field Generators.",
      images: [
        {
          id: 45,
          src: "/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.1.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 46,
          src: "/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.2.jpg",
          alt: "Locked Legion Supply Chest"
        },
        {
          id: 47,
          src: "/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.3.jpg",
          alt: "Locked Legion Supply Chest"
        }
      ]
    },
    {
      id: 22,
      title: "Memorystick (Scavenger 114's Wish)",
      text: "Drop down, and slightly north of the monorail cabin is a dead human.",
      images: [
        {
          id: 48,
          src: "/assets/images/Wasteland/3-ScrapPlains/25-Memorystick-Scavenger 114's Wish.1.jpg",
          alt: "Memorystick (Scavenger 114's Wish)"
        },
        {
          id: 49,
          src: "/assets/images/Wasteland/3-ScrapPlains/25-Memorystick-Scavenger 114's Wish.2.jpg",
          alt: "Memorystick (Scavenger 114's Wish)"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="scrap-plains">Scrap Plains Collectibles</h3>
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

export default ScrapPlains;
