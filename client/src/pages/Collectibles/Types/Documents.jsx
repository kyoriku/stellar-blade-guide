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
      title: "Document - Series - Plastic Hearts, Vol. 3",
      text: "After heading through the door (using the Fusion Cell), head left, defeat the Barnacle, and this document is a book on the shelf in the southeast corner."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Document - Messages - Memo",
      text: "In the same room, on the wall."
    },
    {
      id: 3,
      level: "Eidos 7",
      location: "Parking Tower",
      title: "Document - The Truth, Article 3",
      text: "Head north of the camp, and then head east at the end. In a building called Otenb Pomakc is a blue box where you'd usually find a newspaper. It's basically underneath the room you just climbed to."
    },
    {
      id: 4,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Document - Books - The Words of the Devout Felix",
      text: "As part of “The Words of the Mother Sphere“ side quest (from Francis, at the book shop in Xion). In the library near Silent Street."
    },
    {
      id: 5,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Documents - Announcements - :::WARNING:::",
      text: "Head back to the Hall of Records, and interact with the plinth in the plaza, as part of the “Taboo“ side quest."
    },
    {
      id: 6,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Document - Series - Book of Faith and Wisdom 2:3-6",
      text: "Inside Warehouse 77, also at the bottom of the ladder."
    },
    {
      id: 7,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Document - Journal - Survival Journal",
      text: "Part of the “End of the Nightmare“ side quest in the previously flooded Commercial District (have to lift the floodgates, fast-travel to a different place, and then return to Eidos 7 for this one to appear). North side of the river, at the lowest level you can go"
    },
    {
      id: 8,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Xion #3",
      text: "After coming out of the Presence Chamber (and a load of cutscenes), head to the left-hand corner of the room you enter into."
    },
    {
      id: 9,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Attention, Citizens! 2)",
      text: "A few steps left of the waypoint near where Adam and Lily parted ways with you outside of the Presence Chamber."
    },
    {
      id: 10,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Attention, Citizens! 1)",
      text: "Just to the right of the waypoint."
    },
    {
      id: 11,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Funding Announcements: Colony Bound Rocket)",
      text: "From the waypoint, turn 180 degrees and run forward. On a metal shutter, to the right of a blue work desk."
    },
    {
      id: 12,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (Plastic Hearts, Vol. 5)",
      text: "Head down the stairs next to the last collectible, until you hit Gwen Hair Salon. Then take a left down the stairs. The collectible is on a barrel down that corridor (that has a dead-end with a red banner)."
    },
    {
      id: 13,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Help Wanted)",
      text: "Leave the alleyway and head towards Sisters' Junk. When you see the Liquor neon sign, there's a collectible to the left of it, near a doorway (down a few steps)."
    },
    {
      id: 14,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Truth, Article 2)",
      text: "Do another 180 and head towards the vending machines behind you. To its left is a blue newspaper box. Interact with it. It's opposite the stairs up to Sisters' Junk."
    },
    {
      id: 15,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (For You Dimwits Still Believing In Mother Sphere)",
      text: "After heading up the stairs to Sisters' Junk, take a left and there's another poster there, in the corner near the fence."
    },
    {
      id: 16,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Curse the Heaven's Royalty)",
      text: "Before going down the stairs to Sisters' Junk, head up the stairs to the right of them. The poster is on a metal shutter up the stairs to the right."
    },
    {
      id: 17,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Prayer Meeting Guide)",
      text: "From the previous chest, go down the stairs and head right. The poster is on a metal shutter to the right."
    },
    {
      id: 18,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Lost 72 Years 2)",
      text: "To the left of Sisters' Junk is this book."
    },
    {
      id: 19,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Xion Freedom Liberation Alliance Flyer)",
      text: "Down the stairs from Sisters' Junk, take a right (south) until you reach a steam grate on the floor, and then head left. The poster is on a metal shutter in the thin alleyway."
    },
    {
      id: 20,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Lost 72 Years 1)",
      text: "On the bench opposite Roxanne and the Bulletin Board."
    },
    {
      id: 21,
      level: "Xion",
      location: "Xion",
      title: "Available to purchase from Roxanne:",
      text: [
        "Document - Information: Solar Tower", 
        "Document - Information: Can", 
        "Document - Information: Crazy Drone", 
        "Document - Information: Prayer Password", 
        "Document - Information: Personal Link with Orcal", 
        "Document - Series (The Xion #6)", 
        "Document - Series (Plastic Hearts, Vol. 1)", 
        "Document - Series (Notes on EVE Protocol 3)"
      ]
    },
    {
      id: 22,
      level: "Xion",
      location: "Xion",
      title: "Available to purchase from Roxanne after restoring the second Hyper Cell:",
      text: [
        "Document - Information: Oasis", 
        "Document - Information: Hypertube"
      ]
    },
    {
      id: 23,
      level: "Xion",
      location: "Xion",
      title: "Document - Promotions (Angels Are Rigged)",
      text: "On the wall by the body for the Missing Husband Request, near The Last Gulp."
    },
    {
      id: 24,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Xion #5)",
      text: "By the fence at the end of the same alley as the previous document and memorystick."
    },
    {
      id: 25,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (The Xion #1)",
      text: "Just to the left of the Fiz machine is this document."
    },
    {
      id: 26,
      level: "Xion",
      location: "Xion",
      title: "Document - Log Data (CT27932)",
      text: "Visit the console in The Cradle, underneath Xion after accepting the Sleeping Beauty Request and you'll get this document."
    },
    {
      id: 27,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)",
      text: "In the alleyway to the right of the exit (as if you're leaving Xion to head back to the ship), at the end of said alleyway is a book store. You'll find these books on the shelves."
    },
    {
      id: 28,
      level: "Xion",
      location: "Xion",
      title: "Document - Series (Notes on EVE Protocol 1)",
      text: "On your way back to the safehouse, on the final bridge, before you start to cross it. On the side on the right."
    },
    {
      id: 29,
      level: "Xion",
      location: "Xion",
      title: "Documents - Journal (DB372-25)",
      text: "Submerged in the small pond by the exit to the Wasteland. If you picked up the Lost Device request from the Bulletin Board, just follow the quest marker."
    },
    {
      id: 30,
      level: "Xion",
      location: "Xion",
      title: "Document - Messages (Kasim's Memo)",
      text: "In the Gwen Hair Salon (which opens up after you agree to go to the Wasteland on foot), which is in the centre of Xion, near the stairs that leads to Sisters' Junk."
    },
    {
      id: 31,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Messages - Request Letter",
      text: "Speak to the young girl to the south of the entrance to Xion (down the ladder). She'll give you this document, which will start the “Oblivion“ side quest."
    },
    {
      id: 32,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Available to purchase from Lyle:",
      text: [
        "Document - Book - Light of the Colony", 
        "Document - Book - Angel Accepting Shed Tears", 
        "Document - Book - For a Better World", 
        "Document - Book - Book of Quotes 1", 
        "Document - Book - Eidos Company Promotion", 
        "Document - Book - Tattered Report 1", 
        "Document - Series - Notes on EVE Protocol 2"
      ]
    },
    {
      id: 33,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Legion Supply Box / Document - Journal - Aaron's Journal",
      text: "Return to the area where the “Angel of Death“ side quest ambush took place and you can enter the garage now with the aSaSaS code (which can be found in the Junkyard in the Wasteland)."
    },
    {
      id: 34,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Promotions - To My Allies",
      text: "Just south of the Gwen Hair Salon, at some point, you'll find a document, which will start the side quest “A United People Cannot be Defended“. Didn't show up until we returned from a prolonged stint in the Great Desert."
    },
    {
      id: 35,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Series - The Lost 72 Years 4",
      text: "Opposite the southernmost Waypoint in Xion (triggered by some completion of a side quest, we imagine)."
    },
    {
      id: 36,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Promotions - Introducing the Ark-Tech's Ark!",
      text: "Speak to Mann after returning from Altess Levoire to start the “Lost Ark“ side mission. Follow the waypoint to the northeast of Xion, and you will come across the body of the radical."
    },
    {
      id: 37,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Promotions - Experience Ark-Tech's Ark!",
      text: "After investigating the body, head over to the second location that has just been marked on your map. Check at the device next to the entrance of the Ark for this document."
    },
    {
      id: 38,
      level: "Xion",
      location: "Xion (Continued)",
      title: "Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!",
      text: "Check the large monitor inside the same room, it's just up the steps from the pile of bodies."
    },
    {
      id: 39,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Robot - Document - Series - The Xion #2",
      text: "East of the supply camp is a robot who drops this document."
    },
    {
      id: 40,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Document - Prayers - Chapter of Trial 5 - d",
      text: "East of the supply camp, in the closest cliffface is a small cave with a shrine in it."
    },
    {
      id: 41,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Document - Log Data - S2RV1C2-7812's Data",
      text: "Southeast of the supply camp is a small yellow droid. Interact with it to unlock this log."
    },
    {
      id: 42,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Document - Messages - Do Not Disturb",
      text: "On the front of the building east of the previous collectible. Near the ladder."
    },
    {
      id: 43,
      level: "Wasteland",
      location: "Scrap Yard",
      title: "Available to purchase from D1G-g2r:",
      text: [
        "Document - Information - Service Drones", 
        "Document - Series - Plastic Hearts, Vol. 2", 
        "Document - Information - Conspiracy"
      ]
    },
    {
      id: 44,
      level: "Wasteland",
      location: "Wasteland Basin",
      title: "Document - Series - The Truth, Article 5",
      text: "Continue on the path west from the Fiz machine until you come to a small open-area, on the north side, next to a vending machine, is a blue newspaper dispensary. Interact to get this document."
    },
    {
      id: 45,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Document - Prayers - Chapter of Trial 6 - S",
      text: "From the elevator, heading northwest, before the path goes directly west, on the right (east) is a dead end. In that southern wall is a small cave with a shrine in it."
    },
    {
      id: 46,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Document - Series - The Truth, Article 1",
      text: "Drop down a level and head east to the end where you will see a newspaper dispenser. Interact with it for this document. There's also a Drone Upgrade Module beside it."
    },
    {
      id: 47,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Document - Journal - Investigation Journal",
      text: "You'll find this as part of the side quest, “Keeping Secrets“ - part of the Su and Enya storyline. North of the Solar Tower."
    },
    {
      id: 48,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Document - Journal - Search Record",
      text: "Also part of the side quest, “Keeping Secrets“ - part of the Su and Enya storyline. Northeast of the Solar Tower."
    },
    {
      id: 49,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Document - Journal - Arin's Journal",
      text: "During “Stolen Treasure“, you'll have to head to the Villa in the Scrap Plains (east of the Central Scrap Plains Supply Camp). Upstairs near the bot. Part of the quest."
    },
    {
      id: 50,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Document - Prayers - Chapter of Salvation 0 - Omega",
      text: "In the same container as the previous Nano Suit."
    },
    {
      id: 51,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Document - Messages - I'm Leaving",
      text: "After finishing D1g-g2r's side quests he'll leave to go to Xion. When he does, return to the Wasteland and head to the Scrapyard. On a large computer screen to the east of the entrance (under a box and by a ladder), you'll be able to interact with the screen to grab this collectible."
    },
    {
      id: 52,
      level: "Altess Levoire",
      location: "Research Lab Entrance",
      title: "Document - Messages - You Are Fake",
      text: "As you walk down the stairs when Lily says the timelines don't match up. Can't miss this one."
    },
    {
      id: 53,
      level: "Altess Levoire",
      location: "Purification Scanner",
      title: "Document - Log Data - Booting Sequence",
      text: "After the wallrunning over the fallen floor section, it's on the floor in front of you."
    },
    {
      id: 54,
      level: "Altess Levoire",
      location: "Security Center",
      title: "Document - Messages - Humanity Liberation Front",
      text: "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right."
    },
    {
      id: 55,
      level: "Altess Levoire",
      location: "Sector A07",
      title: "Document - Log Data (Security Procedure Guide)",
      text: "After the symbol floor puzzle, on the right before you go through the next door."
    },
    {
      id: 56,
      level: "Altess Levoire",
      location: "Specimen Preservation Lab",
      title: "Document - Announcements - Visitor Information",
      text: "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!"
    },
    {
      id: 57,
      level: "Altess Levoire",
      location: "Specimen Preservation Lab",
      title: "Robot - Document - Promotions - Eidos Company Promotion",
      text: "In the far left room (as if you were facing the way you came in), there's a robot in there now."
    },
    {
      id: 58,
      level: "Matrix 11",
      location: "Closed Off Platform",
      title: "Document - Announcements - Great Desert Crossing Exploration Team Advertisement",
      text: "You'll find this one on the floor by the fast-travel phone booth in the Supply Camp."
    },
    {
      id: 59,
      level: "Matrix 11",
      location: "Closed Off Platform",
      title: "Robot - Document - Announcements - Transport Delay Notice",
      text: "Crash through the wooden struts down the stairs and the robot is right ahead."
    },
    {
      id: 60,
      level: "Matrix 11",
      location: "Underground Sewer",
      title: "Robot - Document - Log Data - To the Little Drone",
      text: "Head southwest and into the floodgate control room. Firstly, however, head upstairs and there is a robot above it."
    },
    {
      id: 61,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Document - Journal - Crevice",
      text: "Head back to the main corridor and then head west. Opposite the Fusion Cell locked door, there's a machine there with this journal."
    },
    {
      id: 62,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Document - Journal - Z's Diary",
      text: "In the room where the survivors were, head left and interact with the bookcase."
    },
    {
      id: 63,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Document - Messages - J's Memo",
      text: "Interact with the notice board near the neon Liquor sign downstairs in the same area."
    },
    {
      id: 64,
      level: "Matrix 11",
      location: "Rotten Labyrinth",
      title: "Document - Prayers - Chapter of Trial 1- B",
      text: "On the actual memorial."
    },
    {
      id: 65,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Document - Series - Notes on EVE Protocol 4",
      text: "West of the supply camp, by some rubble."
    },
    {
      id: 66,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Document - Log Data - S2RV1C2-875687's Data",
      text: "East from the previous supply chest in the ruined city area."
    },
    {
      id: 67,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Document - Series - The Truth, Article 4",
      text: "Just slightly north of the South of Buried Ruins Legion Camp."
    },
    {
      id: 68,
      level: "Great Desert",
      location: "Solar Tower",
      title: "Document - Prayer - Chapter of Trial 3 - a",
      text: "Head east out the gate and then head into the building to the north. This collectible is there, in a box on the shrine."
    },
    {
      id: 69,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Document - Log Data - S2RV1C2-99991's Data",
      text: "From the Legion Camp, go forward under the green light, and to the right is a bot with this document on it."
    },
    {
      id: 70,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Document - Series - The Truth, Article 6",
      text: "Just to the northeast of the supply box is a newspaper dispenser with this newspaper in."
    },
    {
      id: 71,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Robot - Document - Series - The Xion #4",
      text: "West of the previous can, in some rocks."
    },
    {
      id: 72,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Document - Books - I Heard It",
      text: "Next to the aforementioned corpse is a bookcase with this book, as part of the “Let There Be Light Again“ side quest."
    },
    {
      id: 73,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Messages - Third Road",
      text: "Next to the corpse that had the aforementioned memorystick. Appears to contain a code: u0ydByKaySSynSyrBy (all y's are upside down)."
    },
    {
      id: 74,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Journal - Orca Aerospace Company Hypertube System",
      text: "As part of “The King of the Tunnel“ side quest, after jumping into the Hyperspace tunnel, you'll end up on the other side of the map. When in the water, dive down to the bottom to find a body with this document."
    },
    {
      id: 75,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Prayer - Chapter of Trial 4 - y",
      text: "Head south out of the water and climb onto land. There's a shrine at the end with this prayer."
    },
    {
      id: 76,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Robot - Document - Series - Plastic Hearts, Vol. 4",
      text: "West of the Hypertube legion camp, on the east side of a massive statue, is a robot with this document in."
    },
    {
      id: 77,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Messages - Truth of the Cradle / The Truth Under the City of Xion",
      text: "As part of the “A United People Cannot be Defeated“ side quest, just a bit further north and you'll have to shoot down some crates with these two documents in them."
    },
    {
      id: 78,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Journal - I Saw It",
      text: "Northwest of the Hypertube Legion Camp is a pod. Next to it is a document. As part of “Let There Be Light Again“ side quest."
    },
    {
      id: 79,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Promotions - Ark-Tech Pioneers Developing the Green Land!",
      text: "East of the Supply Camp, midway up the remains of a building - use the rocks around the edge to get up to this level."
    },
    {
      id: 80,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Document - Prayer - Chapter of Trial 2 - 0",
      text: "East of the previous memorysticks are a load of dilapidated buildings. This is one floor up in one of the western ones."
    },
    {
      id: 81,
      level: "Great Desert",
      location: "Oasis",
      title: "Document - Journal - Damaged Legacy",
      text: "This is dropped by the same person you got the previous memorystick off."
    },
    {
      id: 82,
      level: "Abyss Levoire",
      location: "Emergency Exit",
      title: "Document - Journal - Kill Mother Sphere",
      text: "Once the saw blades have stopped and the fans are off, there is a document near the yellow cube on the left hand side of the room, opposite the legion camp"
    },
    {
      id: 83,
      level: "Abyss Levoire",
      location: "Closed Lobby",
      title: "Document - Log Data - Cultivation Experiment",
      text: "In the room with both control booths, the one in the right-hand corner has a PC on in the corner. Interact with it for this document."
    },
    {
      id: 84,
      level: "Abyss Levoire",
      location: "Underground Passage",
      title: "Document - Log Data - Attack Detected",
      text: "From the previous camp, go into the next room and jump into the control room through the window. The document is on the floor near the blocked stairs."
    },
    {
      id: 85,
      level: "Abyss Levoire",
      location: "Laboratory Ruins",
      title: "Document - Log Data - Mass Production",
      text: "On top of the tall box to the right of the previous supply box"
    },
    {
      id: 86,
      level: "Abyss Levoire",
      location: "Laboratory Ruins",
      title: "Document - Log Data - Quarantine Failure",
      text: "After making your way through the Laboratory Ruins, there will be a document to the left of the door in the red hallway that leads to the room with the camp."
    },
    {
      id: 87,
      level: "Eidos 9",
      location: "Fallen Overpass",
      title: "Robot - Document - Promotions - Eidos 9, Of You and Mother",
      text: "There's also a robot here that drops a document."
    },
    {
      id: 88,
      level: "Eidos 9",
      location: "Fallen Overpass",
      title: "Document - Messages - Ticket to Heaven",
      text: "On the same rooftop, next to the previous memorystick."
    },
    {
      id: 89,
      level: "Eidos 9",
      location: "Submerged City",
      title: "Document - Books - Book of Quotes 2",
      text: "From the previous crate, climb back up and follow the pathway and you'll have to climb up some vents. Once you're done climbing the vents, the document will be on the ground ahead."
    },
    {
      id: 90,
      level: "Eidos 9",
      location: "Atelier",
      title: "Document - Messages - What Will You Choose",
      text: "On the ground inside the Atelier."
    },
    {
      id: 91,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Robot - Document - Promotions - Orca Aerospace Company Promotion",
      text: "Just to the north of the Legion Camp, before you go through the door into the next area."
    },
    {
      id: 92,
      level: "Spire 4",
      location: "Raphael Space Centre",
      title: "Document - Promotions - Welcome to the Raphael Space Centre!",
      text: "Actually in the information kiosk in the middle of the area."
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
