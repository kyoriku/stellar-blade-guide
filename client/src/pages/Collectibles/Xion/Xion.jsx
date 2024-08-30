import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getXion } from '../../../utils/API/xion';

const Xion = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Supply Camp",
      text: "Directly behind you at the beginning of the level, between Adam's tetrapod and Lily's workshop. Can't be missed, as it's the main base of operations and you'll be visiting it frequently.",
    },
    {
      id: 2,
      title: "Legion Supply Box",
      text: " East of the tetrapod, just drop down a level to get it. Includes 2 Omnibolts and Ranged Protection Gear.",
    },
    {
      id: 3,
      title: "Legion Camp",
      text: "Outside the Presence Chamber (following Adam, as part of the story).",
    },
    {
      id: 4,
      title: "Document - Series - The Xion #3",
      text: "After coming out of the Presence Chamber (and a load of cutscenes), head to the left-hand corner of the room you enter into.",
    },
    {
      id: 5,
      title: "Legion Supply Box",
      text: "After Adam and Lily part ways with you, head to the cafe on the right and go behind the counter. Contains 2 x Omnibolt and Risk Taking Gear.",
    },
    {
      id: 6,
      title: "Document - Promotions - Attention, Citizens! 2",
      text: "A few steps left of the waypoint near where Adam and Lily parted ways with you outside of the Presence Chamber.",
    },
    {
      id: 7,
      title: "Document - Promotions - Attention, Citizens! 1",
      text: "Just to the right of the waypoint.",
    },
    {
      id: 8,
      title: "Document -  Promotions - Funding Announcements: Colony Bound Rocket",
      text: "From the waypoint, turn 180 degrees and run forward. On a metal shutter, to the right of a blue work desk.",
    },
    {
      id: 9,
      title: "Document - Series - Plastic Hearts, Vol 5",
      text: "Head down the stairs next to the last collectible, until you hit Gwen Hair Salon. Then take a left down the stairs. The collectible is on a barrel down that corridor (that has a dead-end with a red banner).",
    },
    {
      id: 10,
      title: "Can - The Machinetta Americano",
      text: "Do a 180 from the last collectible, and up high on the other side of the street/alleyway, is a Fiz machine. Interact and it'll drop this can.",
    },
    {
      id: 11,
      title: "Document - Promotions - Help Wanted",
      text: "Leave the alleyway and head towards Sisters' Junk. When you see the Liquor neon sign, there's a collectible to the left of it, near a doorway (down a few steps).",
    },
    {
      id: 12,
      title: "Document - Series - The Truth, Article 2",
      text: "Do another 180 and head towards the vending machines behind you. To its left is a blue newspaper box. Interact with it. It's opposite the stairs up to Sisters' Junk.",
    },
    {
      id: 13,
      title: "Document - Promotions - For You Dimwits Still Believing In Mother Sphere",
      text: "After heading up the stairs to Sisters' Junk, take a left and there's another poster there, in the corner near the fence.",
    },
    {
      id: 14,
      title: "Document - Promotions - Curse the Heaven's Royalty",
      text: "Before going down the stairs to Sisters' Junk, head up the stairs to the right of them. The poster is on a metal shutter up the stairs to the right.",
    },
    {
      id: 15,
      title: "Locked Supply Chest",
      text: "Carry on along the balcony above Sisters' Junk until you hit a doorway with some stairs up on the right. There's a chest at the top of the stairs. Beat the directional passcode mini game to open it.",
    },
    {
      id: 16,
      title: "Document - Promotions - Prayer Meeting Guide",
      text: "From the previous chest, go down the stairs and head right. The poster is on a metal shutter to the right.",
    },
    {
      id: 17,
      title: "Can - Mountain Sparkle Mont Blanc",
      text: "To the left of the previous poster (above Sisters' Junk), is another Fiz machine where you can get this can.",
    },
    {
      id: 18,
      title: "Document - Series - The Lost 72 Years 2",
      text: "To the left of Sisters' Junk is this book.",
    },
    {
      id: 19,
      title: "Document - Promotions - Xion Freedom Liberation Alliance Flyer",
      text: "Down the stairs from Sisters' Junk, take a right (south) until you reach a steam grate on the floor, and then head left. The poster is on a metal shutter in the thin alleyway.",
    },
    {
      id: 20,
      title: "Can - Bayern Weissbier Dunkel",
      text: "Between the waypoint and the bulletin board is an alleyway with this can at the end of it.",
    },
    {
      id: 21,
      title: "Can - Dionysus 3",
      text: "180 from the previous can, head back up the alley and head to the right. At the top of the hill take the stairs and there's another can in front of you.",
    },
    {
      id: 22,
      title: "Legion Supply Box",
      text: "Right next to the Bulletin Board.",
    },
    {
      id: 23,
      title: "Document - Series - The Lost 72 Years 1",
      text: "On the bench opposite Roxanne and the Bulletin Board.",
    },
    {
      id: 24,
      title: "Available to purchase from Roxanne:",
      text: [
        "Document - Information: Solar Tower",
        "Document - Information: Can",
        "Document - Information: Crazy Drone",
        "Document - Information: Prayer Password",
        "Document - Information: Personal Link with Orcal",
        "Document - Series: The Xion #6",
        "Document - Series: Plastic Hearts, Vol. 1",
        "Document - Series: Notes on EVE Protocol 3",
      ],
    },
    {
      id: 25,
      title: "Roxanne Level 2 Affinity:",
      text: [
        "Nano Suit Design Pattern: Planet Diving Suit (2nd)",
        "Nano Suit Design Pattern: Orca Exploration Suit",
      ],
    },
    {
      id: 26,
      title: "Roxanne Level 3 Affinity:",
      text: [
        "Nano Suit Design Pattern: Keyhole Dress",
        "Nano Suit Design Pattern: Cybernetic Dress",
        "Nano Suit Design Pattern: Moutan Peony",
      ],
    },
    {
      id: 27,
      title: "Available to purchase from Roxanne after restoring the second Hyper Cell:",
      text: [
        "Document - Information: Oasis",
        "Document - Information: Hypertube",
      ],
    },
    {
      id: 28,
      title: "Can - Behemoth Red",
      text: "In an alleyway that leads to The Last Gulp (where Su and Enya are) there's a Fiz machine on the left as you start to head down the alleyway.",
    },
    {
      id: 29,
      title: "Document - Promotions - Angels Are Rigged",
      text: "On the wall by the body for the Missing Husband Request, near The Last Gulp.",
    },
    {
      id: 30,
      title: "Memorystick - Matthew's Memory",
      text: "On the ground directly to the left of the Angel Is A Lie poster.",
    },
    {
      id: 31,
      title: "Document - Series - The Xion #5",
      text: "By the fence at the end of the same alley as the previous document and memorystick.",
    },
    {
      id: 32,
      title: "Can - The Machinetta Caramel Macchiato",
      text: "At the far end of the northern plaza with the large planet sculpture in the centre, in the far right hand corner (to the right of Delloih), up some stairs, there is a Fiz machine.",
    },
    {
      id: 33,
      title: "Document - Series - The Xion #1",
      text: "Just to the left of the Fiz machine is this document.",
    },
    {
      id: 34,
      title: "Can - Pixie",
      text: "To the left of the Delloih place, outside a window display with mannequins and near a skateboard.",
    },
    {
      id: 35,
      title: "Robot - Passcode - θθκκκε",
      text: "In a metal crate in the far north of the map (to the left of Delloih, opposite the cafe near the entrance to Presence Chamber).",
    },
    {
      id: 36,
      title: "Locked Supply Chest",
      text: "If you look forward from the cafe, with it behind you, cross the plaza to the other side until you see Delloih. Take the stairs to the left of it and around that building is a locked chest. The passcode from the robot unlocks this crate.",
    },
    {
      id: 37,
      title: "Document - Log Data - CT27932",
      text: "Visit the console in The Cradle, underneath Xion after accepting the Sleeping Beauty Request and you'll get this document.",
    },
    {
      id: 38,
      title: "Legion Supply Box",
      text: "On the roof next to the bizarre shop with the statue inside, near the entrance/exit to Xion.",
    },
    {
      id: 39,
      title: "Document - Series - Book of Faith and Wisdom 2:1-4, Series - The Lost 72 Years 3, & Book - How to Speak with Style",
      text: "In the alleyway to the right of the exit (as if you're leaving Xion to head back to the ship), at the end of said alleyway is a book store. You'll find these books on the shelves.",
    },
    {
      id: 40,
      title: "Document - Series - Notes on EVE Protocol 1",
      text: "On your way back to the safehouse, on the final bridge, before you start to cross it. On the side on the right.",
    },
    {
      id: 41,
      title: "Legion Supply Box",
      text: "Where the 3 bridges converge in Xion is a rope. Go down the rope, down the ladder, and follow the platforms to the end.",
    },
    {
      id: 42,
      title: "Can - GrainT Oolong",
      text: "There's also a can on the rock behind the supply box. Jump over to pick it up.",
    },
    {
      id: 43,
      title: "Document - Journal - DB372-25",
      text: "Submerged in the small pond by the exit to the Wasteland. If you picked up the Lost Device request from the Bulletin Board, just follow the quest marker.",
    },
    {
      id: 44,
      title: "Document - Messages - Kasim's Memo",
      text: "In the Gwen Hair Salon (which opens up after you agree to go to the Wasteland on foot), which is in the centre of Xion, near the stairs that leads to Sisters' Junk.",
    }
  ]

  useEffect(() => {
    fetchXionCollectibles();
  }, []);

  const fetchXionCollectibles = async () => {
    try {
      const data = await getXion();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
<section>
  <Header id="xion" title="▽ Xion Collectibles" />
  <ErrorMessage message={error} />
  <ContentSection
    staticContent={staticContent}
    content={content}
    isLoading={isLoading}
    bottomMarginCondition={24}
    additionalBottomMargin={true}
  />
</section>

  );
};

export default Xion;
