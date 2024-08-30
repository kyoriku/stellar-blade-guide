import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getXionContinued } from '../../../utils/API/xion';

const XionContinued = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Document - Messages - Request Letter",
      text: "Speak to the young girl to the south of the entrance to Xion (down the ladder). She'll give you this document, which will start the “Oblivion” side quest.",
    },
    {
      id: 2,
      title: "Available to purchase from Lyle:",
      text: [
        "Document - Book - Light of the Colony",
        "Document - Book - Angel Accepting Shed Tears",
        "Document - Book - For a Better World",
        "Document - Book - Book of Quotes 1",
        "Document - Book - Eidos Company Promotion",
        "Document - Book - Tattered Report 1",
        "Document - Series - Notes on EVE Protocol 2",
      ],
    },
    {
      id: 3,
      title: "Lyle Level 2 Affinity:",
      text: [
        "Nano Suit Design Pattern: Daily Biker",
        "Nano Suit Design Pattern: Black Full Dress",
      ],
    },
    {
      id: 4,
      title: "Lyle Level 3 Affinity:",
      text: [
        "Nano Suit Design Pattern: Junk Mechanic",
        "Nano Suit Design Pattern: Daily Denim",
      ],
    },
    {
      id: 5,
      title: "Locked Supply Chest",
      text: "Next to Sisters' Junk is a chest that can be opened once you've found Tommy in the “Life of the Scavengers” side quest.",
    },
    {
      id: 6,
      title: "Legion Supply Box / Document - Journal - Aaron's Journal",
      text: "Return to the area where the “Angel of Death” side quest ambush took place and you can enter the garage now with the aSaSaS code (which can be found in the Junkyard in the Wasteland).",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "West of Gwen Hair Salon is a locked door. Use the passcode ηαεδγγ to open it, which you get from the Great Desert, to the south-southeast of the Solar Tower in the south.",
    },
    {
      id: 8,
      title: "Document - Promotions - To My Allies",
      text: "Just south of the Gwen Hair Salon, at some point, you'll find a document, which will start the side quest “A United People Cannot be Defended.” Didn't show up until we returned from a prolonged stint in the Great Desert.",
    },
    {
      id: 9,
      title: "Document - Series - The Last 72 Years 4",
      text: "Opposite the southernmost Waypoint in Xion (triggered by some completion of a side quest, we imagine).",
    },
    {
      id: 10,
      title: "Document - Promotions - Introducing the Ark-Tech's Ark!",
      text: "Speak to Mann after returning from Altess Levoire to start the “Lost Ark side” mission. Follow the waypoint to the northeast of Xion, and you will come across the body of the radical.",
    },
    {
      id: 11,
      title: "Document - Promotions - Experience Ark-Tech's Ark!",
      text: "After investigating the body, head over to the second location that has just been marked on your map. Check at the device next to the entrance of the Ark for this document.",
    },
    {
      id: 12,
      title: "Memorystick - Lament of the Trapped",
      text: "Once inside, you have to investigate four bodies in order to determine what happened inside of the Ark. The first one is right at the door.",
    },
    {
      id: 13,
      title: "Memorystick - Monolog of a Trapped Man",
      text: "The second body is in a small room on the left side, kneeling by a chair.",
    },
    {
      id: 14,
      title: "Memorystick - Let Me Out",
      text: "The next body is in the big room on the right side, by a large pile of bodies.",
    },
    {
      id: 15,
      title: "Memorystick - Who Are You Guys",
      text: "The last body is in the same room as the previous one, turn around and you'll see it against the wall by one of the doors.",
    },
    {
      id: 16,
      title: "Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!",
      text: "Check the large monitor inside the same room, it's just up the steps from the pile of bodies.",
    },
  ];

  useEffect(() => {
    fetchXionContinuedCollectibles();
  }, []);

  const fetchXionContinuedCollectibles = async () => {
    try {
      const data = await getXionContinued();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header
        id="xion-continued"
        title="▽ Xion Collectibles (Continued)"
        subtitle="The next set of collectibles won't be available on your first time through the area, and require a side quest/Request/Double Jump to access them."
      />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
        alwaysShowFinalHr={true}
      />
    </section>
  );
};

export default XionContinued;
