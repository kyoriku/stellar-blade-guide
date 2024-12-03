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
      location: "Construction Zone",
      title: "Can - Potential Blast",
      text: "In the east-southeast corner (near another lift), climb the wrecked building to the top, and you'll find a can on the table there."
    },
    {
      id: 2,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Can - Elixir Carrot",
      text: "Head north from where you found the robot and inside The Red Grill (with a flashing neon red closed sign) is this can."
    },
    {
      id: 3,
      level: "Eidos 7",
      location: "Eidos 7 (Continued)",
      title: "Can - Cryo Original",
      text: "Head back down and follow the path around to the southeast. After passing the liquor store, you'll come across a Fizz machine on the left."
    },
    {
      id: 4,
      level: "Xion",
      location: "Xion",
      title: "Can - The Machinetta Americano",
      text: "Do a 180 from the last collectible, and up high on the other side of the street/alleyway, is a Fiz machine. Interact and it'll drop this can."
    },
    {
      id: 5,
      level: "Xion",
      location: "Xion",
      title: "Can - Mountain Sparkle Mont Blanc",
      text: "To the left of the previous poster (above Sisters' Junk), is another Fiz machine where you can get this can."
    },
    {
      id: 6,
      level: "Xion",
      location: "Xion",
      title: "Can - Bayern Weissbier Dunkel",
      text: "Between the waypoint and the bulletin board is an alleyway with this can at the end of it."
    },
    {
      id: 7,
      level: "Xion",
      location: "Xion",
      title: "Can - Dionysus 3",
      text: "180 from the previous can, head back up the alley and head to the right. At the top of the hill take the stairs and there's another can in front of you."
    },
    {
      id: 8,
      level: "Xion",
      location: "Xion",
      title: "Can - Behemoth Red",
      text: "In an alleyway that leads to The Last Gulp (where Su and Enya are) there's a Fiz machine on the left as you start to head down the alleyway."
    },
    {
      id: 9,
      level: "Xion",
      location: "Xion",
      title: "Can - The Machinetta Caramel Macchiato",
      text: "At the far end of the northern plaza with the large planet sculpture in the centre, in the far right hand corner (to the right of Delloih), up some stairs, there is a Fiz machine."
    },
    {
      id: 10,
      level: "Xion",
      location: "Xion",
      title: "Can - Pixie",
      text: "To the left of the Delloih place, outside a window display with mannequins and near a skateboard."
    },
    {
      id: 11,
      level: "Xion",
      location: "Xion",
      title: "Can - GrainT Oolong",
      text: "There's also a can on the rock behind the supply box. Jump over to pick it up."
    },
    {
      id: 12,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Can - Potential Tempest",
      text: "Turn on 2 consoles in the area north of the Solar Tower, then push the yellow box to the shipping container in the middle of the area to turn on the final console. The chest next to it will open, which has this can inside."
    },
    {
      id: 13,
      level: "Wasteland",
      location: "Barren Lands",
      title: "Can - GrainT Corn",
      text: "On the eastern path from the previous items (the path that leads to Altess Levoire)"
    },
    {
      id: 14,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Can - Cryo Cafe Original",
      text: "Behind the ship (west side). Head out via a hole in the wall near the last two collectibles and then head south."
    },
    {
      id: 15,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Can - Behemoth Green",
      text: "East of the ship to the south-southeast of the Solar Tower Entrance is a chest that needs 2 spheres to open. The one is next to it. The other is to the southwest. There is a can inside."
    },
    {
      id: 16,
      level: "Wasteland",
      location: "Great Canyon",
      title: "Can - Cryo Zero",
      text: "Head south from the previous supply box to a large crate. Opening it will free a flying dartboard. Shoot it and follow it south. Shoot it again, and again, follow it south and then east. Shoot it to get it to drop the can."
    },
    {
      id: 17,
      level: "Wasteland",
      location: "Scrap Plains",
      title: "Can - Corsair Lager",
      text: "Northwest of the Waypoint is a yellow structure. The crate is up high. Head to the north of that dead end from where you are. At the top is a level that drops one of the platforms on a timer. Pull the lever, race back, avoid the two turrets, and the chest is all yours."
    },
    {
      id: 18,
      level: "Wasteland",
      location: "Wasteland Basin",
      title: "Can - Bayern Hefe WeissBier",
      text: "Pull a 180 from the memorystick, and the Fiz machine is straight ahead."
    },
    {
      id: 19,
      level: "Wasteland",
      location: "Scrap Plains (Continued)",
      title: "Can - Pixie Zero",
      text: "Just nearby the previous one, head to the northern edge and shoot the 3 girders where the drone is. Doing that will cause the drone to fly upwards and dig up a can for you."
    },
    {
      id: 20,
      level: "Wasteland",
      location: "Plant",
      title: "Can - The Machinetta Cafe Latte",
      text: "Push all three storage trolleys on the pressure plates and this will drop from the crane."
    },
    {
      id: 21,
      level: "Wasteland",
      location: "Great Canyon (Continued)",
      title: "Can - GrainT Barley",
      text: "Solve the pressure plate puzzle in the same area, by putting all 3 carts on the left-hand pressure plate (so it reads 23 on the left and 3 on the right)."
    },
    {
      id: 22,
      level: "Wasteland",
      location: "Forbidden Area",
      title: "Can - Cryo The Clear",
      text: "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the ”Life of the Scavengers”  side quest."
    },
    {
      id: 23,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Can - Mountain Sparkle Haller",
      text: "Now that you have Double Jump, fast-travel to the Western Great Canyon Supply Camp and head north, and climb the cliffs to the north. Keep running, jumping and climbing until you reach the top. There's an ice chest with this can in it."
    },
    {
      id: 24,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Can - Elixir Green",
      text: "East-northeast of the Central Scrap Plains Supply Camp (just slightly west of the Waypoint) are some metal platforms. Climb to the top (needs Double Jump) and you'll find the can up there.Use the ramp on the west to get up top."
    },
    {
      id: 25,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Can - The Haven Green Tea",
      text: "take the path up to the north from the Solar Tower and bend round to the east, when you drop down (while still heading east), where the Racer's High Nano Suit was, you're actually going to want to drop down to the south, and then platform the way along a few cliffs and up a lot of them too. There's only one way to go, so stick on the path and you'll be at the ladder and the can in no time."
    },
    {
      id: 26,
      level: "Wasteland",
      location: "Wasteland (Continued)",
      title: "Can - Nectar Orange",
      text: "Next to the Central Great Canyon Legion Camp is a billboard. Pull over the yellow crate from the north to the steel girder. Double jump up and walk across the billboard for this can."
    },
    {
      id: 27,
      level: "Matrix 11",
      location: "Collapsed Rail Bridge",
      title: "Can - Cryo Cafe Vanilla",
      text: "In the southwest corner of the Rail Yard where you fight the Stalker, on the platform along the edge."
    },
    {
      id: 28,
      level: "Matrix 11",
      location: "Temporary Armoury",
      title: "Can - Newfoundland Dry",
      text: "In the southwest corner of the boss fight arena."
    },
    {
      id: 29,
      level: "Matrix 11",
      location: "Train Graveyard",
      title: "Can - Corsair Ale",
      text: "If you follow the passage to the north, you can swim under (near the middle to the left). There you'll find this can on the eastern side."
    },
    {
      id: 30,
      level: "Great Desert",
      location: "Collapsed Overpass",
      title: "Can - Johnson's Highball Lemon",
      text: "Southeast of the Debris-Filled Entryway is some quick sand. On the southeast of that (east of the Waypoint north of the Solar Tower) is a cave. Head inside, kill the 2 Lurkers, and then push the yellow crate to the end and climb the wall. The can crate is at the top."
    },
    {
      id: 31,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Starwell",
      text: "West of the legion camp is a Road Closed sign in front of a large rock. In the middle will be a glint every so often. Drop a Smart Mine and it'll spawn 2 Creepers and a Lurker (as well as this can chest). Kill the enemies, grab the can."
    },
    {
      id: 32,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Potential Frost",
      text: "On the next roof, where you have to wall jump, do a 180 and you'll see a can crate behind some lasers. Jump and dodge to get through them to get this can."
    },
    {
      id: 33,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Johnson's Highball Ginger",
      text: "Drop down to the east, and then in the southeast corner of the next area you'll see a Fiz machine with this can."
    },
    {
      id: 34,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - The Haven Milk Tea",
      text: "To get this one, you need to solve a door puzzle to the north of the Opera House. Take out the turret and then put the hover storage on the pressure plates, so that they all equal 4, 6 and 7 (from west to east). Once you've done that and got all greens, open the door to the northeast. Inside is a can chest."
    },
    {
      id: 35,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Behemoth Black",
      text: "East of the previous pressure plate puzzle is another one. This time put the yellow boxes on 12, 2 and 13. Once you do, the can pops out the chest at the south end of the area."
    },
    {
      id: 36,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Mountain Sparkle Everest",
      text: "Head northeast from the camp and push the yellow block all the way to the north to block the lasers. The can is behind the lasers."
    },
    {
      id: 37,
      level: "Great Desert",
      location: "Buried Ruins",
      title: "Can - Liquid Nuclear",
      text: "From inside the same area, head to the right and over the wall. Push the yellow block all the way around to reach the yellow ledge at the other end of the room. Then jump up, go to the left and drop down."
    },
    {
      id: 38,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Can - Newfoundland Dry Zero",
      text: "A little further northwest from the memorystick, in a ditch, is a crate sticking out of the sand. Shoot it for this can."
    },
    {
      id: 39,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Can - Nectar Cranberry",
      text: "Northwest of the rock formation with the previous collectibles, climb the wall and platform on the drones until you can reach the platform with the ice camp cooler."
    },
    {
      id: 40,
      level: "Great Desert",
      location: "Central Great Desert",
      title: "Can - Milky Pop Zero",
      text: "Head north from the previous supply box and go around the back of the rock feature. Climb up on the north-facing wall, look up and shoot a target to the northeast, and then use the swinging poles and rope to get up to the top where the ice camp cooler is."
    },
    {
      id: 41,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Can - Cryo Cafe Mocha",
      text: "East-northeast of the Great Desert Outskirts Supply is an Ice Camp cooler. Interact with it, shoot the 3 targets, and then pick up the can."
    },
    {
      id: 42,
      level: "Great Desert",
      location: "Northern Great Desert",
      title: "Can - Liquid Fire",
      text: "South of the aforementioned memorystick, on the roof, is an Ice Camp cooler. Interact with it and shoot the explosive barrels before they hit you to unlock this one. Make sure you have plenty of ammo!"
    },
    {
      id: 43,
      level: "Great Desert",
      location: "Oasis",
      title: "Can - Nectar Grape",
      text: "South of the Oasis, near a platform with a cable running to it, is a Fiz machine with this can in."
    },
    {
      id: 44,
      level: "Great Desert",
      location: "Oasis",
      title: "Can - The Haven Early Grey",
      text: "Follow the Hypertube all the way east and you'll find the cooler at the end."
    },
    {
      id: 45,
      level: "Great Desert",
      location: "Oasis",
      title: "Can - Cryo the Malt",
      text: "Just northeast of West of Buried Ruins Legion Camp is a mini-game of sorts. Firstly, you need to shoot a floating target to drop a rope. Second, you need to climb up and power the generator. Thirdly, you need to race to the second and third before the time expires. Do that, and you'll open the garage door below where you end up, which has a can inside."
    },
    {
      id: 46,
      level: "Spire 4",
      location: "Hypertube",
      title: "Can - Milky Pop",
      text: "Upstairs in the southeast corner of the large warehouse (before leaving through the door out of the area), after the brief boss figh with Belial."
    },
    {
      id: 47,
      level: "Spire 4",
      location: "Space Logistics Complex",
      title: "Can - Liquid Lightning",
      text: "East of the Supply Camp, behind a crate. Perhaps the easiest to find out of all of them so far."
    },
    {
      id: 48,
      level: "Spire 4",
      location: "Raphael Space Centre",
      title: "Can - Nectar Apple",
      text: "The other side of the seats, behind him."
    },
    {
      id: 49,
      level: "Spire 4",
      location: "Tower Outer Wall",
      title: "Can - Moonwell",
      text: "From the previous crate, after defeating the Machine Hive, you can jump around the wall to the right and there will be a vending machine at the end with the can inside. If you miss this one, you can fish it up from the Oasis in the Great Desert using Strange Bait after finishing Spire 4"
    }
  ]

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
              <SkeletonLoader />
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
