import CollectiblesSection from "../../../components/CollectiblesSection";

const RottenLabyrinth = () => {
  const staticContent = [
    {
      id: 1,
      title: "Locked Legion Supply Box",
      text: "In the first room of the Rotten Labyrinth, up on a walkway to the left (same room as the Hive)."
    },
    {
      id: 2,
      title: "Memorystick - Pascal's Warning",
      text: "Head down the north tunnel before leaving that first room and there'll be a body in the short tunnel at the end."
    },
    {
      id: 3,
      title: "Memorystick - Daisy's Memory",
      text: "In the next curved corridor, that leads into the next room."
    },
    {
      id: 4,
      title: "Robot - Passcode - λβκβδβ",
      text: "In the next room with 2 Cricket Butchers in them. Climb up the ladder to the west as you walk in, and then jump across to the other side. The robot is there."
    },
    {
      id: 5,
      title: "Beta Core",
      text: "In the north-northeast corner of the same room. Climb the ladder (where you will eventually put in the Fusion Cell) and then turn around. In that room straight ahead, down the bottom, is a Beta Core."
    },
    {
      id: 6,
      title: "Memorystick - Harry's Memory",
      text: "Opposite the place where you put in the Fusion Cell. Up top. Jump and swing across."
    },
    {
      id: 7,
      title: "Memorystick - Jesse's Memory",
      text: "After climbing the elevator shaft and going down the stairs. Look to the north and there's a body in that dead end."
    },
    {
      id: 8,
      title: "Robot - Tumbler Expansion Module",
      text: "Head down the ladder and take a left at the junction. The robot is up the stairs there."
    },
    {
      id: 9,
      title: "Locked Supply Chest",
      text: "Follow the corridor west and then on the right will be an offshoot of a corridor (next to a corpse). The chest (with the Fusion Cell) is at the end."
    },
    {
      id: 10,
      title: "Memorystick - Leona's Advice",
      text: "After using the Fusion Cell to open the door, the memorystick is on the body straight ahead, on a mattress."
    },
    {
      id: 11,
      title: "Exospine - Beta Trance-Type ",
      text: "Head east from the main junction and destroy the two planks (and 3 enemies). The box with this Exospine is straight ahead."
    },
    {
      id: 12,
      title: "Document - Journal - Crevice",
      text: "Head back to the main corridor and then head west. Opposite the Fusion Cell locked door, there's a machine there with this journal."
    },
    {
      id: 13,
      title: "Document - Journal - Z's Diary",
      text: "In the room where the survivors were, head left and interact with the bookcase."
    },
    {
      id: 14,
      title: "Locked Supply Chest",
      text: "Next to the guitar is a locked chest (needs Passcode λβκβδβ)."
    },
    {
      id: 15,
      title: "Legion Supply Box",
      text: "In the southwest corner near the beds."
    },
    {
      id: 16,
      title: "Memorystick - Susan's Warning",
      text: "In the back corner, near the bunk beds, on top of a mattress."
    },
    {
      id: 17,
      title: "Document - Messages - J's Memo",
      text: "Interact with the notice board near the neon Liquor sign downstairs in the same area."
    },
    {
      id: 18,
      title: "Legion Camp",
      text: "Same room, head up the ladder and it's smack bang in front of you."
    },
    {
      id: 19,
      title: "Legion Supply Box",
      text: "Next to the Legion Camp."
    },
    {
      id: 20,
      title: "Document - Prayers - Chapter of Trial 1- B",
      text: "On the actual memorial."
    },
    {
      id: 21,
      title: "Memorystick - Jake's Speech",
      text: "In the memorial room, on the right-hand side. Next to the Fusion Cell."
    },
    {
      id: 22,
      title: "Nano Suit - Daily Force",
      text: "As you leave, look up to the right of the entrance, there's a chest there with this nano suit design inside."
    },
    {
      id: 23,
      title: "Robot - Drone Upgrade Module",
      text: "Head back downstairs and head up the tunnel to the northeast. There's a robot there."
    },
    {
      id: 24,
      title: "Legion Supply Box",
      text: "Just up to the left of the first Hive monster."
    },
    {
      id: 25,
      title: "Memorystick - Katherine's Testament",
      text: "Destroy the second Hive monster, and take the tunnel that it was covering."
    },
    {
      id: 26,
      title: "Beta Core",
      text: "In the same area, just in a different offshoot of a tunnel (southern one)."
    },
    {
      id: 27,
      title: "Memorystick - Sam's Resignation",
      text: "After sliding down the ramp and ending up in front of the old generator, there's a corpse next to it."
    },
    {
      id: 28,
      title: "Legion Supply Box",
      text: "The other side of the lift (use the controls to jump on and jump over the fence). Need the Hacking Tool installed."
    }
  ];

  return (
    <CollectiblesSection
      id="rotten-labyrinth"
      title="Rotten Labyrinth"
      level="Matrix-11"
      location="Rotten-Labyrinth"
      staticContent={staticContent}
    />
  );
};

export default RottenLabyrinth;
