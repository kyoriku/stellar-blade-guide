import React from "react";
import MediaDisplay from "../../../components/Media";

const WastelandContinued = () => {
  const content = [
    {
      id: 1,
      title: "Can - Mountain Sparkle Haller",
      text: "Now that you have Double Jump, fast-travel to the Western Great Canyon Supply Camp and head north, and climb the cliffs to the north. Keep running, jumping and climbing until you reach the top. There’s an ice chest with this can in it.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.1.jpg",
          alt: "Can - Mountain Sparkle Haller"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.2.jpg",
          alt: "Can - Mountain Sparkle Haller"
        },
        {
          id: 3,
          src: "/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.3.jpg",
          alt: "Can - Mountain Sparkle Haller"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.4.jpg",
          alt: "Can - Mountain Sparkle Haller"
        },
        {
          id: 5,
          src: "/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.5.jpg",
          alt: "Can - Mountain Sparkle Haller"
        }
      ]
    },
    {
      id: 2,
      title: "Beta Core",
      text: "Just to the right of the can is a human body with this Beta Core in it.",
      images: [
        {
          id: 6,
          src: "/assets/images/Wasteland/11-WastelandCont/2-Beta Core.1.jpg",
          alt: "Beta Core"
        },
        {
          id: 7,
          src: "/assets/images/Wasteland/11-WastelandCont/2-Beta Core.2.jpg",
          alt: "Beta Core"
        }
      ]
    },
    {
      id: 3,
      title: "Adam Outfit (Junkman)",
      text: "Head up further (to the north) and then head west and south across the bridge. There you'll find a lot of enemies and also a crate with this inside.",
      images: [
        {
          id: 8,
          src: "/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.1.jpg",
          alt: "Adam Outfit (Junkman)"
        },
        {
          id: 9,
          src: "/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.2.jpg",
          alt: "Adam Outfit (Junkman)"
        },
        {
          id: 10,
          src: "/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.3.jpg",
          alt: "Adam Outfit (Junkman)"
        }
      ]
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Northeast of the Barren Land Legion Camp is a wall you can climb (near the waypoint, north facing cliff face).",
      images: [
        {
          id: 11,
          src: "/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.1.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 12,
          src: "/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.2.jpg",
          alt: "Legion Supply Box"
        },
        {
          id: 13,
          src: "/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.3.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 5,
      title: "Document - Journal (Investigation Journal)",
      text: "You'll find this as part of the side quest, “Keeping Secrets” - part of the Su and Enya storyline. North of the Solar Tower.",
      images: [
        {
          id: 14,
          src: "/assets/images/Wasteland/11-WastelandCont/5-Document-Journal Investigation Journal.1.jpg",
          alt: "Document - Journal (Investigation Journal)"
        },
        {
          id: 15,
          src: "/assets/images/Wasteland/11-WastelandCont/5-Document-Journal Investigation Journal.2.jpg",
          alt: "Document - Journal (Investigation Journal)"
        }
      ]
    },
    {
      id: 6,
      title: "Document - Journal (Search Record)",
      text: "Also part of the side quest, “Keeping Secrets” - part of the Su and Enya storyline. Northeast of the Solar Tower.",
      images: [
        {
          id: 16,
          src: "/assets/images/Wasteland/11-WastelandCont/6-Document-Journal-Search Record.1.jpg",
          alt: "Document - Journal (Search Record)"
        },
        {
          id: 17,
          src: "/assets/images/Wasteland/11-WastelandCont/6-Document-Journal-Search Record.2.jpg",
          alt: "Document - Journal (Search Record)"
        }
      ]
    },
    {
      id: 7,
      title: "Document - Journal (Arin's Journal)",
      text: "During “Stolen Treasure,” you'll have to head to the Villa in the Scrap Plains (east of the Central Scrap Plains Supply Camp). Upstairs near the bot. Part of the quest.",
      images: [
        {
          id: 18,
          src: "/assets/images/Wasteland/11-WastelandCont/7-Document-Journal-Arin's Journal.1.jpg",
          alt: "Document - Journal (Arin's Journal)"
        },
        {
          id: 19,
          src: "/assets/images/Wasteland/11-WastelandCont/7-Document-Journal-Arin's Journal.2.jpg",
          alt: "Document - Journal (Arin's Journal)"
        }
      ]
    },
    {
      id: 8,
      title: "Beta Core",
      text: "Northwest of the Junkyard Supply Camp is a wallrunning section that you need to Double Jump for. Head back there and follow the path to the end for this Beta Core.",
      images: [
        {
          id: 20,
          src: "/assets/images/Wasteland/11-WastelandCont/8-Beta Core.1.jpg",
          alt: "Beta Core"
        },
        {
          id: 21,
          src: "/assets/images/Wasteland/11-WastelandCont/8-Beta Core.2.jpg",
          alt: "Beta Core"
        },
        {
          id: 22,
          src: "/assets/images/Wasteland/11-WastelandCont/8-Beta Core.3.jpg",
          alt: "Beta Core"
        }
      ]
    },
    {
      id: 9,
      title: "Can - Elixir Green",
      text: "East-northeast of the Central Scrap Plains Supply Camp (just slightly west of the Waypoint) are some metal platforms. Climb to the top (needs Double Jump) and you'll find the can up there.Use the ramp on the west to get up top.",
      images: [
        {
          id: 23,
          src: "/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.1.jpg",
          alt: "Can - Elixir Green"
        },
        {
          id: 24,
          src: "/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.2.jpg",
          alt: "Can - Elixir Green"
        },
        {
          id: 25,
          src: "/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.3.jpg",
          alt: "Can - Elixir Green"
        },
        {
          id: 26,
          src: "/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.4.jpg",
          alt: "Can - Elixir Green"
        }
      ]
    },
    {
      id: 10,
      title: "Can - The Haven Green Tea",
      text: "take the path up to the north from the Solar Tower and bend round to the east, when you drop down (while still heading east), where the Racer's High Nano Suit was, you're actually going to want to drop down to the south, and then platform the way along a few cliffs and up a lot of them too. There's only one way to go, so stick on the path and you'll be at the ladder and the can in no time.",
      images: [
        {
          id: 27,
          src: "/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.1.jpg",
          alt: "Can - The Haven Green Tea"
        },
        {
          id: 28,
          src: "/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.2.jpg",
          alt: "Can - The Haven Green Tea"
        },
        {
          id: 29,
          src: "/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.3.jpg",
          alt: "Can - The Haven Green Tea"
        },
        {
          id: 30,
          src: "/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.4.jpg",
          alt: "Can - The Haven Green Tea"
        }
      ]
    },
    {
      id: 11,
      title: "Can - Nectar Orange",
      text: "Next to the Central Great Canyon Legion Camp is a billboard. Pull over the yellow crate from the north to the steel girder. Double jump up and walk across the billboard for this can.",
      images: [
        {
          id: 31,
          src: "/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.1.jpg",
          alt: "Can - Nectar Orange"
        },
        {
          id: 32,
          src: "/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.2.jpg",
          alt: "Can - Nectar Orange"
        },
        {
          id: 33,
          src: "/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.3.jpg",
          alt: "Can - Nectar Orange"
        }
      ]
    },
    {
      id: 12,
      title: "Nano Suit - La Vie En Rose",
      text: "Use the code B0aydS on the ship container to the west of the Western Grand Canyon Supply Camp (part of the “Recruit Passcode Specialists” Request).",
      images: [
        {
          id: 34,
          src: "/assets/images/Wasteland/11-WastelandCont/12-Nano Suit & Document-Prayers.jpg",
          alt: "Nano Suit - La Vie En Rose"
        },
        {
          id: 35,
          src: "/assets/images/Wasteland/11-WastelandCont/12-Nano Suit-La Vie En Rose.1.jpg",
          alt: "Nano Suit - La Vie En Rose"
        },
        {
          id: 36,
          src: "/assets/images/Wasteland/11-WastelandCont/12-Nano Suit-La Vie En Rose.2.jpg",
          alt: "Nano Suit - La Vie En Rose"
        }
      ]
    },
    {
      id: 13,
      title: "Document - Prayers (Chapter of Salvation 0 - Omega)",
      text: "In the same container as the previous Nano Suit.",
      images: [
        {
          id: 37,
          src: "/assets/images/Wasteland/11-WastelandCont/13-Document-Prayers-Chapter of Salvation 0-Omega.1.jpg",
          alt: "Document - Prayers (Chapter of Salvation 0 - Omega)"
        },
        {
          id: 38,
          src: "/assets/images/Wasteland/11-WastelandCont/13-Document-Prayers-Chapter of Salvation 0-Omega.2.jpg",
          alt: "Document - Prayers (Chapter of Salvation 0 - Omega)"
        }
      ]
    },
    {
      id: 14,
      title: "Document - Messages - I'm Leaving",
      text: "After finishing D1g-g2r's side quests he'll leave to go to Xion. When he does, return to the Wasteland and head to the Scrapyard. On a large computer screen to the east of the entrance (under a box and by a ladder), you'll be able to interact with the screen to grab this collectible.",
      images: [
        {
          id: 39,
          src: "/assets/images/Wasteland/11-WastelandCont/14-Document - Messages - I'm Leaving.1.jpg",
          alt: "Document - Messages - I'm Leaving"
        },
        {
          id: 40,
          src: "/assets/images/Wasteland/11-WastelandCont/14-Document - Messages - I'm Leaving.2.jpg",
          alt: "Document - Messages - I'm Leaving"
        }
      ]
    }
  ];

  return (
    <div>
      <h3 id="wasteland-continued">Wasteland Collectibles (Continued)</h3>
      <p><i>The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them.</i></p>
      <hr></hr>
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

export default WastelandContinued
