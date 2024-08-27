import React, { useEffect, useState } from "react";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentSection from "../../../components/ContentSection";
import { getRaphaelSpaceCentre } from '../../../utils/API/spire4';

const RaphaelSpaceCentre = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Terry's Resignation",
      text: "In the next room, on the left, by a barricade.",
    },
    {
      id: 2,
      title: "Memorystick - Jim's Resolution",
      text: "Next to the previous memorystick.",
    },
    {
      id: 3,
      title: "Memorystick - Kane's Memory / Passcode - nErBEr",
      text: "Further north of the other two, nearer the far wall.",
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 749's Testament",
      text: "Southeast from the other one, leaning up against the Information Kiosk.",
    },
    {
      id: 5,
      title: "Memorystick - Legionnaire 715's Advice",
      text: "Head further east from the previous one and this one is slumped against some seats.",
    },
    {
      id: 6,
      title: "Can - Nectar Apple",
      text: "The other side of the seats, behind him.",
    },
    {
      id: 7,
      title: "Document - Promotions - Welcome to the Raphael Space Centre!",
      text: "Actually in the information kiosk in the middle of the area.",
    },
    {
      id: 8,
      title: "Memorystick - Legionnaire 729's Memory",
      text: "This body is in the southwest corner of the foyer. Same area.",
    },
    {
      id: 9,
      title: "Body Core",
      text: "In Gate 2 (after using the passcode), this body is found near the contaminated crates in the middle.",
    },
    {
      id: 10,
      title: "Legion Supply Box",
      text: "In the door on your right as you head to the other door on the other side of the foyer. Careful, it's guarded by a Heavy Droid who has 4 Aid Drones as wingmen.",
    },
    {
      id: 11,
      title: "Nano Suit - Black Rose",
      text: "In the east corner (next to where you need to go) is a laser puzzle room. Approach the box, and then dodge the lasers and make your way to the control panel on the eastern wall.",
    },
    {
      id: 12,
      title: "Robot - Drone Upgrade Modules",
      text: "On the right as you walk into the next room, hiding in all the contaminated materials.",
    },
    {
      id: 13,
      title: "Memorystick - Legionnaire 251's Resolution",
      text: "On the left as you walk in through the main door (north).",
    },
    {
      id: 14,
      title: "Memorystick - Legionnaire 212's End",
      text: "Just next to the aforementioned body.",
    },
    {
      id: 15,
      title: "Memorystick - Legionnaire 754's Shout",
      text: "North from the last pair of bodies, slumped in the corner of the room.",
    },
    {
      id: 16,
      title: "Legion Supply Box",
      text: "Now head east from that body to the far wall. There's a crate there.",
    },
    {
      id: 17,
      title: "Memorystick - Legionnaire 751's Testament",
      text: "You'll find this one slumped up against the south wall of the same room.",
    },
    {
      id: 18,
      title: "Supply Camp - Raphael Space Centre Lobby",
      text: "In the east corner of the same room.",
    },
    {
      id: 19,
      title: "Legion Supply Box",
      text: "Opposite the cargo elevator.",
    },
    {
      id: 20,
      title: "Legion Supply Box",
      text: "After you get out the lift, it's straight ahead of you.",
    },
  ];


  useEffect(() => {
    fetchRaphaelSpaceCentreCollectibles();
  }, []);

  const fetchRaphaelSpaceCentreCollectibles = async () => {
    try {
      const data = await getRaphaelSpaceCentre();
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
      <Header id="raphael-space-centre" title="▽ Raphael Space Centre Collectibles" />
      <ErrorMessage message={error} />
      <ContentSection
        staticContent={staticContent}
        content={content}
        isLoading={isLoading}
      />
    </section>
  );
};

export default RaphaelSpaceCentre
