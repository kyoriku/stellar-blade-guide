import React from "react";
import MediaDisplay from "../../../components/MediaDisplay";

const ResearchLab = () => {
  const content = [
    {
      id: 1,
      title: "Document - Messages (You Are Fake)",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one.",
      images: [
        {
          id: 1,
          src: "/assets/images/AltessLevoire/1-ResearchLab/1-Document - Messages - You Are Fake.jpg",
          alt: "Documents - Messages (You Are Fake)"
        }
      ]
    },
    {
      id: 2,
      title: "Document - Log Data (Booting Sequence)",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you.",
      images: [
        {
          id: 2,
          src: "/assets/images/AltessLevoire/1-ResearchLab/2-Document - Log Data - Booting Sequence.jpg",
          alt: "Document - Log Data (Booting Sequence)"
        }
      ]
    },
    {
      id: 3,
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor.",
      images: [
        {
          id: 3,
          src: "/assets/images/AltessLevoire/1-ResearchLab/3-Legion Camp.jpg",
          alt: "Legion Camp"
        }
      ]
    },
    {
      id: 4,
      title: "Document - Messages (Humanity Liberation Front)",
      text: "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right.",
      images: [
        {
          id: 4,
          src: "/assets/images/AltessLevoire/1-ResearchLab/4-Document - Messages - Humanity Liberation Front.jpg",
          alt: "Document - Messages (Humanity Liberation Front)"
        }
      ]
    },
    {
      id: 5,
      title: "Legion Supply Chest",
      text: "By the door you just opened. Can't miss it.",
      images: [
        {
          id: 5,
          src: "/assets/images/AltessLevoire/1-ResearchLab/5-Legion Supply Chest.jpg",
          alt: "Legion Supply Chest"
        }
      ]
    }
  ];

  return (
    <div>
      <hr className="divider" id="research-lab"></hr>
      <h3>▽ Research Lab Collectibles</h3>
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

export default ResearchLab
