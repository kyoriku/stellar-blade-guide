import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getWastelandBasin } from "../../../utils/API/wasteland";

const WastelandBasin = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Sentinel 47's Decision",
      text: "Carry on south up the hill from the Corrupter Boss Fight.",
    },
    {
      id: 2,
      title: "Nano Suit - Holiday Bunny",
      text: "Next to the human body where the memorystick came from is a small box where this Nano Suit can be found.",
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "Southwest of the waypoint is a decently sized encampment. Clear the enemies, and then use the batteries on the pressure plates to open the gates. First, the one on the left to free the orange box. Second on the right to free the second battery. Then, put both of the batteries on the plates to open the door. Push the orange box southwest, and use it to get on top of the place where you freed the trapped battery. Has an Omnibolt and Gold Gear inside of it.",
    },
    {
      id: 4,
      title: "Nano Suit - Cyber Magician",
      text: "Drop down, push the orange box through the main gate and onto the big platform. Then jump up and climb the rope, interact with the chest, and shoot all the targets except the red ones before they disappear. Do that and this nano suit is all yours.",
    },
    {
      id: 5,
      title: "Memorystick - Citizen 290's Prayer",
      text: "Follow the path west from the waypoint, the memorystick is between the ruined building and the rocky hill.",
    },
    {
      id: 6,
      title: "Can - Bayern Hefe WeissBier",
      text: "Pull a 180 from the memorystick, and the Fiz machine is straight ahead.",
    },
    {
      id: 7,
      title: "Document - Series - The Truth, Article 5",
      text: "Continue on the path west from the Fiz machine until you come to a small open-area, on the north side, next to a vending machine, is a blue newspaper dispensary. Interact to get this document.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "Opposite the previous collectible, behind the ruins to the south.",
    }
  ];

  useEffect(() => {
    fetchWastelandBasinCollectibles();
  }, []);

  const fetchWastelandBasinCollectibles = async () => {
    try {
      const data = await getWastelandBasin();
      setContent(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch collectibles. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <Header id="wasteland-basin" title="▽ Wasteland Basin Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default WastelandBasin;
