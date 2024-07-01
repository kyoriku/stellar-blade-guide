import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const OilStorageFacility = () => {
  const content = [
    {
      id: 1,
      title: "Memorystick (Lee's Complaint)",
      text: "This is part of the “Urgent Information” side quest.",
      images: [
        {
          id: 1,
          src: "/assets/images/Wasteland/4-OilStorageFacility/1-Memorystick-Lee's Complaint.1.jpg",
          alt: "Memorystick (Lee's Complaint)"
        },
        {
          id: 2,
          src: "/assets/images/Wasteland/4-OilStorageFacility/1-Memorystick-Lee's Complaint.2.jpg",
          alt: "Memorystick (Lee's Complaint)"
        }
      ]
    },
    {
      id: 2,
      title: "Memorystick (Woo's Record)",
      text: "This is part of the “Urgent Information” side quest.",
      images: [
        {
          id: 3,
          src: "/assets/images/Wasteland/4-OilStorageFacility/2-Memorystick-Woo's Record.1.jpg",
          alt: "Memorystick (Young's Screams)"
        },
        {
          id: 4,
          src: "/assets/images/Wasteland/4-OilStorageFacility/2-Memorystick-Woo's Record.2.jpg",
          alt: "Memorystick (Young's Screams)"
        }
      ]
    },
    {
      id: 3,
      title: "Memorystick (Young's Screams)",
      text: "This is part of the “Urgent Information” side quest.",
      images: [
        {
          id: 5,
          src: "/assets/images/Wasteland/4-OilStorageFacility/3-Memorystick-Young's Screams.1.jpg",
          alt: "Memorystick (Young's Screams)"
        },
        {
          id: 6,
          src: "/assets/images/Wasteland/4-OilStorageFacility/3-Memorystick-Young's Screams.2.jpg",
          alt: "Memorystick (Young's Screams)"
        }
      ]
    },
    {
      id: 4,
      title: "Body Core",
      text: "Right at the northside of the oil storage facility, inside a shipping container.",
      images: [
        {
          id: 7,
          src: "/assets/images/Wasteland/4-OilStorageFacility/4-Body Core.1.jpg",
          alt: "Body Core"
        },
        {
          id: 8,
          src: "/assets/images/Wasteland/4-OilStorageFacility/4-Body Core.2.jpg",
          alt: "Body Core"
        }
      ]
    },
  ];

  return (
    <div>
      <h3 id="oil-storage-facility">Oil Storage Facility Collectibles</h3>
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

export default OilStorageFacility;
