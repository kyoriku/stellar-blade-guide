import React from "react";
import MediaDisplay from "../../../components/Media";

const GreatCanyon = () => {
  const content = [
    {
      id: 1,
      title: "Memorystick (Citizen 224's Memory)",
      text: "Head south from the Barren Land Legion Camp into the Great Canyon. Straight ahead is a corpse by a car (and a few Hedgeboars).",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/2-GreatCanyon/1-Memorystick-Citizen 224's Memory.1.jpg",
          alt: "Memorystick (Citizen 224's Memory)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/2-GreatCanyon/1-Memorystick-Citizen 224's Memory.2.jpg",
          alt: "Memorystick (Citizen 224's Memory)"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: "Just slightly south of the aforementioned memorystick.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/2-GreatCanyon/2-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/2-GreatCanyon/2-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 3,
      title: "Memorystick (Scavenger 212's Testament)",
      text: "Head west from the two previous collectibles, and there'll be a human corpse in the next passageway.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/2-GreatCanyon/3-Memorystick-Scavenger 212's Testament.1.jpg",
          alt: "Memorystick (Scavenger 212's Testament)"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/2-GreatCanyon/3-Memorystick-Scavenger 212's Testament.2.jpg",
          alt: "Memorystick (Scavenger 212's Testament)"
        }
      ]
    },
    {
      id: 4,
      title: "Memorystick (Citizen 212's Memory)",
      text: "Continue west from the previous memorystick and there'll be two Hedgeboars. Next to it is this human corpse and memorystick.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/2-GreatCanyon/4-Memorystick-Citizen 212's Memory.1.jpg",
          alt: "Memorystick (Citizen 212's Memory)"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/2-GreatCanyon/4-Memorystick-Citizen 212's Memory.2.jpg",
          alt: "Memorystick (Citizen 212's Memory)"
        }
      ]
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "Next to the previous memorystick.",
      images: [
        {
          id: 9,
          src: "/assets/images/Wasteland/2-GreatCanyon/5-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/2-GreatCanyon/5-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 6,
      title: "Locked Supply Chest",
      text: "Southwest of the corridor you came into the area, up the hill, is opposite the abandoned ship, is this locked supply crate. Opens with the d-pad mini-game.",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/2-GreatCanyon/6-Locked Supply Chest.1.jpg",
          alt: "Locked Supply Chest"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/2-GreatCanyon/6-Locked Supply Chest.2.jpg",
          alt: "Locked Supply Chest"
        }
      ]
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "South of the previous locked chest is a Legion Supply box with 2 Omnibolts and Combat Supply Gear.",
      images: [
        {
          id: 13,
          src: "/assets/images/Wasteland/2-GreatCanyon/7-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 14,
          src: "/assets/images/Wasteland/2-GreatCanyon/7-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 8,
      title: "Memorystick (Citizen 303's Plea)",
      text: "Inside the ship (the south side) there's a corpse inside, inside a shipping container.",
      images: [
        {
          id: 15,
          src: "/assets/images/Wasteland/2-GreatCanyon/8-Memorystick-Citizen 303's Plea.1.jpg",
          alt: "Memorystick (Citizen 303's Plea)"
        },
        {
          id: 16,
          src: "/assets/images/Wasteland/2-GreatCanyon/8-Memorystick-Citizen 303's Plea.2.jpg",
          alt: "Memorystick (Citizen 303's Plea)"
        }
      ]
    },
    {
      id: 9,
      title: "Robot - Passcode - 0nrrrS",
      text: "Inside the shipping container next to the memorystick one (still inside the ship). You get into it via the same shipping container.",
      images: [
        {
          id: 17,
          src: "/assets/images/Wasteland/2-GreatCanyon/9-Robot-Passcode-0nrrrS.1.jpg",
          alt: "Robot - Passcode - 0nrrrS"
        },
        {
          id: 18,
          src: "/assets/images/Wasteland/2-GreatCanyon/9-Robot-Passcode-0nrrrS.2.jpg",
          alt: "Robot - Passcode - 0nrrrS"
        }
      ]
    },
    {
      id: 10,
      title: "Can - Cryo Cafe Original",
      text: "Behind the ship (west side). Head out via a hole in the wall near the last two collectibles and then head south.",
      images: [
        {
          id: 19,
          src: "/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.1.jpg",
          alt: "Can - Cryo Cafe Original"
        },
        {
          id: 20,
          src: "/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.2.jpg",
          alt: "Can - Cryo Cafe Original"
        },
        {
          id: 21,
          src: "/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.3.jpg",
          alt: "Can - Cryo Cafe Original"
        }
      ]
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Northeast of the ship is a load of old abandoned cars. This box in the middle of them. Inside is 2 x Omnibolts and Training Gear",
      images: [
        {
          id: 22,
          src: "/assets/images/Wasteland/2-GreatCanyon/11-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 23,
          src: "/assets/images/Wasteland/2-GreatCanyon/11-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 12,
      title: "Robot - Tumbler Expansion Module",
      text: "In the northwest corner of the large ship, you'll find this robot (south of the Solar Tower region).",
      images: [
        {
          id: 24,
          src: "/assets/images/Wasteland/2-GreatCanyon/12-Robot-Tumbler Expansion Module.1.jpg",
          alt: "Robot - Tumbler Expansion Module"
        },
        {
          id: 25,
          src: "/assets/images/Wasteland/2-GreatCanyon/12-Robot-Tumbler Expansion Module.2.jpg",
          alt: "Robot - Tumbler Expansion Module"
        }
      ]
    },
    {
      id: 13,
      title: "Can - Behemoth Green",
      text: "East of the ship to the south-southeast of the Solar Tower Entrance is a chest that needs 2 spheres to open. The one is next to it. The other is to the southwest. There is a can inside.",
      images: [
        {
          id: 26,
          src: "/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.1.jpg",
          alt: "Can - Behemoth Green"
        },
        {
          id: 27,
          src: "/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.2.jpg",
          alt: "Can - Behemoth Green"
        },
        {
          id: 28,
          src: "/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.3.jpg",
          alt: "Can - Behemoth Green"
        },
        {
          id: 29,
          src: "/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.4.jpg",
          alt: "Can - Behemoth Green"
        }
      ]
    },
    {
      id: 14,
      title: "Legion Supply Box",
      text: "Southwest of the previous box is a Legion Supply Box.",
      images: [
        {
          id: 30,
          src: "/assets/images/Wasteland/2-GreatCanyon/14-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 31,
          src: "/assets/images/Wasteland/2-GreatCanyon/14-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 15,
      title: "Supply Camp (Western Great Canyon)",
      text: "East of the large ship (and south-southeast of the Solar Tower Entrance Supply Camp) is this Supply Camp.",
      images: [
        {
          id: 32,
          src: "/assets/images/Wasteland/2-GreatCanyon/15-Supply Camp-Western Great Canyon.1.jpg",
          alt: "Supply Camp (Western Great Canyon)"
        },
        {
          id: 33,
          src: "/assets/images/Wasteland/2-GreatCanyon/15-Supply Camp-Western Great Canyon.2.jpg",
          alt: "Supply Camp (Western Great Canyon)"
        }
      ]
    },
    {
      id: 16,
      title: "Document - Prayers - Chapter of Trial 5 - d",
      text: "East of the supply camp, in the closest cliffface is a small cave with a shrine in it.",
      images: [
        {
          id: 34,
          src: "/assets/images/Wasteland/2-GreatCanyon/16-Document-Prayers-Chapter of Trial 5-d.1.jpg",
          alt: "Documents Prayers - Chapter of Trial 5 - d"
        },
        {
          id: 35,
          src: "/assets/images/Wasteland/2-GreatCanyon/16-Document-Prayers-Chapter of Trial 5-d.2.jpg",
          alt: "Documents Prayers - Chapter of Trial 5 - d"
        }
      ]
    },
    {
      id: 17,
      title: "Memorystick (Scavenger 103's Farewell)",
      text: "Southeast of the Western Great Canyon Supply Camp (in the middle of some red plants - watch out for the Tentacles).",
      images: [
        {
          id: 36,
          src: "/assets/images/Wasteland/2-GreatCanyon/17-Memorystick-Scavenger 103's Farewell.1.jpg",
          alt: "Memorystick (Scavenger 103's Farewell)"
        },
        {
          id: 37,
          src: "/assets/images/Wasteland/2-GreatCanyon/17-Memorystick-Scavenger 103's Farewell.2.jpg",
          alt: "Memorystick (Scavenger 103's Farewell)"
        }
      ]
    },
    {
      id: 18,
      title: "Legion Camp (Central Great Canyon)",
      text: "East of the previous Supply Camp is this Legion Camp.",
      images: [
        {
          id: 38,
          src: "/assets/images/Wasteland/2-GreatCanyon/18-Legion Camp-Central Grand Canyon.1.jpg",
          alt: "Legion Camp (Central Great Canyon)"
        },
        {
          id: 39,
          src: "/assets/images/Wasteland/2-GreatCanyon/18-Legion Camp-Central Grand Canyon.2.jpg",
          alt: "Legion Camp (Central Great Canyon)"
        }
      ]
    },
    {
      id: 19,
      title: "Legion Supply Box",
      text: "A little further southeast of the Legion Camp is this Supply Box.",
      images: [
        {
          id: 40,
          src: "/assets/images/Wasteland/2-GreatCanyon/19-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 41,
          src: "/assets/images/Wasteland/2-GreatCanyon/19-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 20,
      title: "Memorystick (Yohan's Testimony)",
      text: "Next to the previous Supply Box.",
      images: [
        {
          id: 42,
          src: "/assets/images/Wasteland/2-GreatCanyon/20-Memorystick-Yohan's Testimony.1.jpg",
          alt: "Memorystick (Yohan's Testimony)"
        },
        {
          id: 43,
          src: "/assets/images/Wasteland/2-GreatCanyon/20-Memorystick-Yohan's Testimony.2.jpg",
          alt: "Memorystick (Yohan's Testimony)"
        }
      ]
    },
    {
      id: 21,
      title: "Memorystick (Citizen 275's Testimony)",
      text: "Northwest of the Central Great Canyon Legion Camp is a corpse with this memorystick.",
      images: [
        {
          id: 44,
          src: "/assets/images/Wasteland/2-GreatCanyon/21-Memorystick-Citizen 275's Testimony.1.jpg",
          alt: "Memorystick (Citizen 275's Testimony)"
        },
        {
          id: 45,
          src: "/assets/images/Wasteland/2-GreatCanyon/21-Memorystick-Citizen 275's Testimony.2.jpg",
          alt: "Memorystick (Citizen 275's Testimony)"
        }
      ]
    },
    {
      id: 22,
      title: "Memorystick (Sentinel 27's Testimony)",
      text: "Northeast from the Central Great Canyon Legion Camp is a small nook in the cliff face. Inside you'll find two human corpses, one with this memorystick.",
      images: [
        {
          id: 46,
          src: "/assets/images/Wasteland/2-GreatCanyon/22-Memorystick-Sentinel 27's Testimony.1.jpg",
          alt: "Memorystick (Sentinel 27's Testimony)"
        },
        {
          id: 47,
          src: "/assets/images/Wasteland/2-GreatCanyon/22-Memorystick-Sentinel 27's Testimony.2.jpg",
          alt: "Memorystick (Sentinel 27's Testimony)"
        }
      ]
    },
    {
      id: 23,
      title: "Body Core",
      text: "Next to the previous memorystick.",
      images: [
        {
          id: 48,
          src: "/assets/images/Wasteland/2-GreatCanyon/23-Body Core.1.jpg",
          alt: "Body Core"
        },
        {
          id: 49,
          src: "/assets/images/Wasteland/2-GreatCanyon/23-Body Core.2.jpg",
          alt: "Body Core"
        }
      ]
    },
    {
      id: 24,
      title: "Robot (2x Drone Upgrade Modules)",
      text: "East of the two previous collectibles, on a thin path that heads east.",
      images: [
        {
          id: 50,
          src: "/assets/images/Wasteland/2-GreatCanyon/24-Robot-2x Drone Upgrade Modules.1.jpg",
          alt: "Robot (2x Drone Upgrade Modules)"
        },
        {
          id: 51,
          src: "/assets/images/Wasteland/2-GreatCanyon/24-Robot-2x Drone Upgrade Modules.2.jpg",
          alt: "Robot (2x Drone Upgrade Modules)"
        }
      ]
    },
    {
      id: 25,
      title: "Memorystick (Sentinel 188's Advice)",
      text: "Carry on east past the robot until you hit a dead-end, where you'll find this memorystick.",
      images: [
        {
          id: 52,
          src: "/assets/images/Wasteland/2-GreatCanyon/25-Memorystick-Sentinel 188's Advice.1.jpg",
          alt: "Memorystick (Sentinel 188's Advice)"
        },
        {
          id: 53,
          src: "/assets/images/Wasteland/2-GreatCanyon/25-Memorystick-Sentinel 188's Advice.2.jpg",
          alt: "Memorystick (Sentinel 188's Advice)"
        }
      ]
    },
    {
      id: 26,
      title: "Legion Supply Box",
      text: "West of the small nook where you found the Body Core and Memorystick.",
      images: [
        {
          id: 54,
          src: "/assets/images/Wasteland/2-GreatCanyon/26-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 55,
          src: "/assets/images/Wasteland/2-GreatCanyon/26-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 27,
      title: "Legion Supply Box",
      text: "Head northwest from the previous box to get to this box (in a dead end near 2 Hedgeboars).",
      images: [
        {
          id: 56,
          src: "/assets/images/Wasteland/2-GreatCanyon/27-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 57,
          src: "/assets/images/Wasteland/2-GreatCanyon/27-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 28,
      title: "Can - Cryo Zero",
      text: "Head south from the previous supply box to a large crate. Opening it will free a flying dartboard. Shoot it and follow it south. Shoot it again, and again, follow it south and then east. Shoot it to get it to drop the can.",
      images: [
        {
          id: 58,
          src: "/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.1.jpg",
          alt: "Can - Cryo Zero"
        },
        {
          id: 59,
          src: "/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.2.jpg",
          alt: "Can - Cryo Zero"
        },
        {
          id: 60,
          src: "/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.3.jpg",
          alt: "Can - Cryo Zero"
        },
        {
          id: 61,
          src: "/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.4.jpg",
          alt: "Can - Cryo Zero"
        },
        {
          id: 62,
          src: "/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.5.jpg",
          alt: "Can - Cryo Zero"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="great-canyon">Great Canyon Collectibles</h3>
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

export default GreatCanyon;
