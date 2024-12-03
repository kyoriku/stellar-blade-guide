import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { getCollectiblesByType } from '../../../utils/API/collectibles';

const CollectiblesByType = () => {
  const { type } = useParams();
  const [collectibles, setCollectibles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollectibles = async () => {
      try {
        const data = await getCollectiblesByType(type);
        setCollectibles(data);
      } catch (err) {
        console.error('Failed to fetch collectibles of type', type, err);
        setError('Failed to fetch collectibles. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (type) {
      fetchCollectibles();
    } else {
      setError('No type provided');
      setIsLoading(false);
    }
  }, [type]);

  const staticContent = [
    {
      id: 1,
      level: "Eidos 7",
      location: "Silent Street",
      title: "Legion Camp",
      text: "Back on Silent Street, down there on the left, near to where you just went swimming"
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Silent Street",
      title: "Legion Camp",
      text: "Up the ladder from the water will be a camp straight ahead."
    },
    {
      id: 3,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Supply Camp - Parking Tower 2nd Floor",
      text: "Up the set of stairs into the parking garage."
    },
    {
      id: 4,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Legion Camp",
      text: "In the southwest corner of the Parking Tower roof."
    },
    {
      id: 5,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Legion Camp",
      text: "Opposite the exit of the parking garage, the camera will focus on it as you exit."
    },
    {
      id: 6,
      level: "Eidos 7",
      location: "Abandoned Station",
      title: "Supply Camp - Abandoned Station",
      text: "Up the elevator shaft in the Abandoned Station."
    },
    {
      id: 7,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Legion Camp",
      text: "At the base of the stairs leading out of the monorail station."
    },
    {
      id: 8,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Supply Camp - Plaza Entryway",
      text: "After using the passcode to unlock the 317 gate, head through and the supply camp is straight ahead."
    },
    {
      id: 9,
      level: "Eidos 7",
      location: "Flooded Commercial Sector",
      title: "Legion Camp",
      text: "After climbing the ladder and dropping down, there's a camp to the west."
    },
    {
      id: 10,
      level: "Eidos 7",
      location: "Memory Tower",
      title: "Legion Camp",
      text: "Up the ladder and to the north is the next camp."
    },
    {
      id: 11,
      level: "Eidos 7",
      location: "Construction Zone",
      title: "Supply Camp - Construction Zone",
      text: "In the centre of the Construction Zone area. On the same level as the area you drop in at. Above the two previous collectibles (in-between them)."
    },
    {
      id: 12,
      level: "Eidos 7",
      location: "City Underground",
      title: "Legion Camp",
      text: "After crossing over the steel beam, this camp is through the door on the left."
    },
    {
      id: 13,
      level: "Eidos 7",
      location: "City Underground",
      title: "Legion Camp",
      text: "Take the rope back up, go left down the tunnel and then right to find this camp."
    },
    {
      id: 14,
      level: "Eidos 7",
      location: "Crater",
      title: "Supply Camp - Crater",
      text: "Just to the right, up the rocks, when you enter the Crater area. Hard to miss."
    },
    {
      id: 15,
      level: "Xion",
      location: "Xion",
      title: "Supply Camp",
      text: "Directly behind you at the beginning of the level, between Adam's tetrapod and Lily's workshop. Can't be missed, as it's the main base of operations and you'll be visiting it frequently."
    },
    {
      id: 16,
      level: "Xion",
      location: "Xion",
      title: "Legion Camp",
      text: "Outside the Presence Chamber (following Adam, as part of the story)."
    },
    {
      id: 17,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Supply Camp - Hidden Path",
      text: "As soon as you enter the area. However, you need to restore power at the Solar Tower to use it (side quest, “Reboot“)."
    },
    {
      id: 18,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Legion Camp - Barren Land",
      text: "Southwest of the previous supply box is the Barren Land Legion Camp."
    },
    {
      id: 19,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Supply Camp (Solar Tower Entrance)",
      text: "You'll find this camp east of the Solar Tower."
    },
    {
      id: 20,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Supply Camp (Western Great Canyon)",
      text: "East of the large ship (and south-southeast of the Solar Tower Entrance Supply Camp) is this Supply Camp."
    },
    {
      id: 21,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Legion Camp (Central Great Canyon)",
      text: "East of the previous Supply Camp is this Legion Camp."
    },
    {
      id: 22,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Supply Camp (Central Scrap Plains)",
      text: "As soon as you enter the Scrap Plains from the Barren Lands."
    },
    {
      id: 23,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Legion Camp - Bus Stop",
      text: "Northeast of the previous shack is a literal bus stop which doubles up as a camp."
    },
    {
      id: 24,
      level: "Wasteland",
      location: "Scrap Yard",
      title: "Supply Camp - Scrap Yard Entrance",
      text: "Follow the path down from the northeast and you'll come to a small robot town (Scrap Yard), as well as this Supply Camp."
    },
    {
      id: 25,
      level: "Wasteland",
      location: "Scrap Plains (Continued)",
      title: "Supply Camp - Junkyard",
      text: "When you get through the wallrunning tutorial as you head south, there'll be a camp on the left."
    },
    {
      id: 26,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Legion Camp - Eastern Great Canyon",
      text: "In the south east corner of the area just before you take the elevator down towards Altess Levoire."
    },
    {
      id: 27,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Supply Camp - Altess Levoire Entrance",
      text: "Directly before the entrance to Altess Levoire."
    },
    {
      id: 28,
      level: "Altess Levoire",
      location: "Purification Scanner",
      title: "Legion Camp",
      text: "After fighting your first infector, this will be in the main corridor."
    },
    {
      id: 29,
      level: "Altess Levoire",
      location: "Sector A07",
      title: "Legion Camp",
      text: "Through the door, on your left"
    },
    {
      id: 30,
      level: "Altess Levoire",
      location: "Top Secret Research Complex",
      title: "Legion Camp",
      text: "As you come down the elevator, there's a camp just on the right."
    },
    {
      id: 31,
      level: "Altess Levoire",
      location: "Deteriorated Lobby",
      title: "Legion Camp",
      text: "After you beat the ambush and make it up the lift."
    },
    {
      id: 32,
      level: "Altess Levoire",
      location: "Air Vent",
      title: "Supply Camp",
      text: "Next to both sets of ladders."
    },
    {
      id: 33,
      level: "Matrix 11",
      location: "Closed Off Platform",
      title: "Supply Camp",
      text: "As soon as you land on Matrix 11, it's on your left."
    },
    {
      id: 34,
      level: "Matrix 11",
      location: "Closed Off Platform",
      title: "Legion Camp",
      text: "At the end of the train tracks and down the ladder is safety."
    },
    {
      id: 35,
      level: "Matrix 11",
      location: "Landfill",
      title: "Legion Camp",
      text: "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it."
    },
    {
      id: 36,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Supply Camp - Twisted Iron Bridge",
      text: "At the end of the tunnel upstairs."
    },
    {
      id: 37,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Legion Camp",
      text: "At the end of this area is a Legion Camp which Adam will say you should rest at."
    },
    {
      id: 38,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Supply Camp - Rail Yard",
      text: "Using N72R5 to open the gate after the Stalker fight will walk you straight into this supply camp."
    },
    {
      id: 39,
      level: "Matrix 11",
      location: "Underground Sewer",
      title: "Legion Camp",
      text: "Down the bottom of the stairs."
    },
    {
      id: 40,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Legion Camp",
      text: "Same room, head up the ladder and it's smack bang in front of you."
    },
    {
      id: 41,
      level: "Matrix 11",
      location: "Temporary Armoury",
      title: "Supply Camp - Temporary Armoury Entrance",
      text: "At the bottom of the lift."
    },
    {
      id: 42,
      level: "Matrix 11",
      location: "Temporary Armoury",
      title: "Legion Camp",
      text: "As you leave the arena in the southeast corner."
    },
    {
      id: 43,
      level: "Matrix 11",
      location: "Train Graveyard",
      title: "Legion Camp",
      text: "After leaving the flooded tunnel, there's a Legion Camp as you exit."
    },
    {
      id: 44,
      level: "Matrix 11",
      location: "Train Graveyard",
      title: "Supply Camp - Contaminated Water Purification Plant Entrance",
      text: "At the top of said stairs, behind the Hive."
    },
    {
      id: 45,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Supply Camp - Great Desert",
      text: "As soon as you land in the Great Desert, this camp is right next to the Tetrapod."
    },
    {
      id: 46,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Supply Camp - Central Great Desert",
      text: "South from the small rocky hill where you begin the “Reboot!!!“ side quest. Move the yellow box around until you can jump up to the ledge. The supply camp is there."
    },
    {
      id: 47,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Supply Camp - Abandoned Overpass",
      text: "North-northwest of the Solar Tower, up on the overpass, above the previous collectible."
    },
    {
      id: 48,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Supply Camp - Way to the Solar Tower",
      text: "Directly to the east of the Abandoned Overpass supply camp."
    },
    {
      id: 49,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Legion Camp - South of Buried Ruins",
      text: "Northeast of the Solar Tower, in an enclosed area in the ruins (if you're coming from the above document, then destroy the barrel in the southern wall to get access to this area)."
    },
    {
      id: 50,
      level: "Great Desert",
      location: "Collapsed Overpass",
      title: "Supply Camp - Debris-Filled Entryway",
      text: "To the north of the previous collectibles is another Supply Camp."
    },
    {
      id: 51,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Legion Camp - West of Buried Ruins",
      text: "Head north, along the outer wall, to unlock the West of Buried Ruins Legion Camp."
    },
    {
      id: 52,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Supply Camp - Crumbling Rooftop",
      text: "From the rooftop, head east-northeast for this supply samp. On the adjacent rooftop."
    },
    {
      id: 53,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Legion Camp - Middle Path Between Ruins",
      text: "Head south-southeast from the Opera House and then take the street east. The Legion Camp is midway down that street."
    },
    {
      id: 54,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Legion Camp - North of Buried Ruins",
      text: "North from the previous beta core and slightly northwest from the Crumbling Rooftop supply camp is the North of Buried Ruins legion camp."
    },
    {
      id: 55,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Supply Camp - Buried Ruins Outskirts",
      text: "North-northeast of the North of Buried Ruins legion camp."
    },
    {
      id: 56,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Supply Camp - Exile's Passage",
      text: "On the road to Xion, in the far southwest of the Great Desert."
    },
    {
      id: 57,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Legion Camp - Northern Great Desert",
      text: "Northeast of the previous collectibles. Slightly south-southeast from the Tetrapod."
    },
    {
      id: 58,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Legion Camp - Hypertube",
      text: "West of the Tetrapod, on the east side of the large tubes (the Hypertubes)."
    },
    {
      id: 59,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Legion Camp - Underground Secret Passage",
      text: "As soon as you come out of the secret passage and go through the gate, the camp is there. When outside, find the nearest fast-travel point and return to Hypertube legion camp (via fast-traveling to the Tetrapod)."
    },
    {
      id: 60,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Supply Camp - Great Desert Outskirts",
      text: "North-northwest from the Hypertube Legion Camp is this Supply Camp. Just to the south of the large ship."
    },
    {
      id: 61,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Supply Camp - Twin Rocks",
      text: "East of the building where the last two collectibles were."
    },
    {
      id: 62,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Supply Camp - Abyss Levoire Entrance",
      text: "Just  to the west of the Abyss Levoire."
    },
    {
      id: 63,
      level: "Great Desert",
      location: "Oasis",
      title: "Supply Camp - Oasis",
      text: "On the northern shore of the Oasis pond."
    },
    {
      id: 64,
      level: "Abyss Levoire",
      location: "Emergency Exit",
      title: "Supply Camp",
      text: "As you enter through the first door, you'll come across the first supply camp."
    },
    {
      id: 65,
      level: "Abyss Levoire",
      location: "Emergency Exit",
      title: "Legion Camp",
      text: "At the end of the saw blade section."
    },
    {
      id: 66,
      level: "Abyss Levoire",
      location: "Capsule Cluster Room",
      title: "Legion Camp",
      text: "Directly after you leave the Capsule Cluster Room."
    },
    {
      id: 67,
      level: "Abyss Levoire",
      location: "Capsule Cluster Room",
      title: "Legion Camp",
      text: "After unlocking the next gate from the previous camp, there will be another camp at the top of the stairs."
    },
    {
      id: 68,
      level: "Abyss Levoire",
      location: "Underground Passage",
      title: "Legion Camp",
      text: "In the room directly after the long hallway where you have to fight waves of enemies"
    },
    {
      id: 69,
      level: "Abyss Levoire",
      location: "Underground Passage",
      title: "Legion Camp",
      text: "On the opposite side from the supply box, through the door."
    },
    {
      id: 70,
      level: "Abyss Levoire",
      location: "Laboratory Ruins",
      title: "Supply Camp",
      text: "After crossing the large room, on the right before the boss fight."
    },
    {
      id: 71,
      level: "Eidos 9",
      location: "Fallen Overpass",
      title: "Legion Camp",
      text: "After killing the first 3 Cocoons, and on your way to the objective, just after Adam tells you there's 6 more, there's a camp on the left."
    },
    {
      id: 72,
      level: "Eidos 9",
      location: "Fallen Overpass",
      title: "Legion Camp",
      text: "From the previous supply box, go downstairs and the camp is at the bottom of the second flight of stairs."
    },
    {
      id: 73,
      level: "Eidos 9",
      location: "Submerged City",
      title: "Legion Camp",
      text: "Backtrack onto the monorail and follow it until it branches paths. Follow the left path, which should lead you to a giant red slide, then go down it. There will be a camp at the bottom of the slide."
    },
    {
      id: 74,
      level: "Eidos 9",
      location: "Submerged City",
      title: "Supply Camp - Submerged City",
      text: "From the previous crate, climb up the building and there will be a camp once you're at the top, before climbing up the ladder."
    },
    {
      id: 75,
      level: "Eidos 9",
      location: "Submerged City",
      title: "Legion Camp",
      text: "Up the ladder from the final Cocoon. Before taking the second ladder to the top, there's a camp on your left."
    },
    {
      id: 76,
      level: "Eidos 9",
      location: "Atelier",
      title: "Legion Camp",
      text: "Once you reach the Atelier, the camp will be on the pathway around to the entrance."
    },
    {
      id: 77,
      level: "Spire 4",
      location: "Orca Space Complex",
      title: "Legion Camp - Space Complex Entryway",
      text: "By the Tetrapod at the start of the level."
    },
    {
      id: 78,
      level: "Spire 4",
      location: "Orca Space Complex",
      title: "Legion Camp",
      text: "Up the ladders in the far corner, leading up to the water controls."
    },
    {
      id: 79,
      level: "Spire 4",
      location: "Orca Space Complex",
      title: "Supply Camp - Hypertube Entrance",
      text: "At the top of the stairs, before you enter the hypertube."
    },
    {
      id: 80,
      level: "Spire 4",
      location: "Hypertube",
      title: "Supply Camp - Space Logistics Complex Entrance",
      text: "Next to the door on the way out of the area."
    },
    {
      id: 81,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Legion Camp",
      text: "After getting past the first set of lasers."
    },
    {
      id: 82,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Supply Camp - Space Logistics Centre",
      text: "After finishing the conveyor belt section, this camp is straight ahead."
    },
    {
      id: 83,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Legion Camp",
      text: "Through the big door and down the rope. On your left."
    },
    {
      id: 84,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Legion Camp",
      text: "At the end of the corridor in the building."
    },
    {
      id: 85,
      level: "Spire 4",
      location: "Cargo Lift 121",
      title: "Legion Camp",
      text: " On the left as you enter the lift."
    },
    {
      id: 86,
      level: "Spire 4",
      location: "Maintenance Sector",
      title: "Legion Camp",
      text: "Once you reach the Maintenance Sector, you can reach the camp by going across the beams on the right end of the room."
    },
    {
      id: 87,
      level: "Spire 4",
      location: "Passenger Lift 161",
      title: "Legion Camp",
      text: "Once you enter the Passenger Elevator, the camp will be directly to your left."
    },
    {
      id: 88,
      level: "Spire 4",
      location: "Prestige Lounge",
      title: "Supply Camp",
      text: "Automatically activated during a cutscene after going through the door in the lounge."
    },
    {
      id: 89,
      level: "Spire 4",
      location: "High Orbit Station",
      title: "Supply Camp",
      text: "There's a supply camp on the right side of the same room as the Beta Core."
    },
    {
      id: 90,
      level: "Spire 4",
      location: "Nest",
      title: "Legion Camp",
      text: "When back on earth, going to fight the Elder Naytiba, this camp is on the left after you see the message from Raven."
    },
    {
      id: 91,
      level: "Spire 4",
      location: "Nest",
      title: "Supply Camp",
      text: "In the nest on the right."
    }
  ];

  const formatTypeForTitle = (type) => {
    return type
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase());  // Capitalize the first letter of each word
  };

  const formattedTypeTitle = formatTypeForTitle(type || '');

  return (
    <section>
      <Header id={type} title={`▽ ${formattedTypeTitle}`} />
      <ErrorMessage message={error} />
      <div>
        {staticContent.map((contentItem, index) => (
          <article key={contentItem.id}>
            <p className="mb-1">
              <strong>Location:</strong> {contentItem.level} - {contentItem.location}
            </p>
            <ContentText
              title={contentItem.title}
              text={contentItem.text}
            />
            {isLoading ? (
              <SkeletonLoader variant="large" />
            ) : (
              collectibles[index] && (
                <MediaDisplay
                  images={collectibles[index].images}
                  addBottomMargin={false}
                />
              )
            )}
            <hr />
          </article>
        ))}
      </div>
    </section>
  );
};

export default CollectiblesByType;
