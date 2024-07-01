import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const SpecimenResearchLab = () => {
  const content = [
    {
      id: 1,
      title: "Legion Supply Chest",
      text: "Up the ladder as you enter, and then head to the right and open the door on your right. Watch out for the 2 Infectors inside.",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/3-SpecimenResearchLab/8-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    },
    {
      id: 2,
      title: "Document - Announcements (Visitor Information)",
      text: "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/3-SpecimenResearchLab/9-Document - Announcements - Visitor Information.jpg",
          alt: "Document - Announcements (Visitor Information)"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Supply Box",
      text: "When you head back towards the ladder (clockwise), a door that was previously closed is now open. There's a box inside.",
      images: [
        {
          id: 3,
          src: "/assets/images/AltessLevoire/3-SpecimenResearchLab/10-Legion Supply Box.jpg",
          alt: "Legion Supply Box"
        }
      ]
    },
    {
      id: 4,
      title: "Robot - Document - Promotions (Eidos Company Promotion)",
      text: "In the far left room (as if you were facing the way you came in), there's a robot in there now.",
      images: [
        {
          id: 4,
          src: "/assets/images/AltessLevoire/3-SpecimenResearchLab/11-Robot - Document - Promotions - Eidos Company Promotion.jpg",
          alt: "Robot - Documents - Promotions (Eidos Company Promotion)"
        }
      ]
    }
  ];

  return (
    <div>
      <hr id="specimen-research-lab"></hr>
      <h3>▽ Specimen Research Lab Collectibles</h3>
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

export default SpecimenResearchLab
