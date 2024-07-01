import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const SectorA07 = () => {
  const content = [
    {
      id: 1,
      title: "Document - Log Data (Security Procedure Guide)",
      text: "After the symbol floor puzzle, on the right before you go through the next door.",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/2-SectorA07/6-Document - Log Data - Security Procedure Guide.jpg",
          alt: "Document - Log Data (Security Procedure Guide)"
        }
      ]
    },
    {
      id: 2,
      title: "Legion Camp",
      text: "Through the door, on your left",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/2-SectorA07/7-Legion Camp.jpg",
          alt: "Legion Camp"
        }
      ]
    }
  ];

  return (
    <div>
      <hr id="sector-a07"></hr>
      <h3>▽ Sector A07 Collectibles</h3>
      <hr className='w-75'></hr>
      {content.map((item, index) => (
        <MediaDisplay
          key={item.id}
          title={item.title}
          text={item.text}
          images={item.images}
          showHr={index !== content.length - 1}
        />
      ))}
    </div>
  );
}

export default SectorA07
