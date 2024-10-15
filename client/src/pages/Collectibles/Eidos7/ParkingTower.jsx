import CollectiblesSection from "../../../components/CollectiblesSection";

const ParkingTower = () => {
  const staticContent = [
    {
      id: 1,
      title: 'Body Core',
      text: 'In the Parking Tower, underneath the first set of stairs up.',
    },
    {
      id: 2,
      title: 'Supply Camp - Parking Tower 2nd Floor',
      text: 'Up the set of stairs into the parking garage.',
    },
    {
      id: 3,
      title: 'Legion Camp',
      text: 'In the southwest corner of the Parking Tower roof.',
    },
    {
      id: 4,
      title: "Memorystick - Legionnaire 204's Memory",
      text: 'Down the southeast ramp from the roof is a corpse with this memorystick.',
    },
    {
      id: 5,
      title: 'Legion Supply Box',
      text: 'In the southwest corner of the parking lot third floor (opposite the previous memorystick, in the corner).',
    },
    {
      id: 6,
      title: 'Chain-Type Exospine',
      text: 'In the northeast corner of the second floor inside the Parking Tower.',
    },
    {
      id: 7,
      title: 'Legion Camp',
      text: 'Opposite the exit of the parking garage, the camera will focus on it as you exit.',
    },
    {
      id: 8,
      title: 'Legion Supply Box',
      text: 'From the camp, head right to the corner of the building on your right. Climb up the yellow crate and shimmy around to the roof. Kill the Guardian, climb up again, kill the Cricket Slasher. In there is a Legion Supply Drop.',
    },
    {
      id: 9,
      title: 'Document - Messages - Memo',
      text: 'In the same room, on the wall.',
    },
    {
      id: 10,
      title: 'Document - The Truth, Article 3',
      text: "Head north of the camp, and then head east at the end. In a building called Otenb Pomakc is a blue box where you'd usually find a newspaper. It's basically underneath the room you just climbed to.",
    },
    {
      id: 11,
      title: 'Memorystick - Outcry to the Sky',
      text: "Opposite the previous collectible, near a statue, you'll find another human corpse with a memorystick.",
    },
    {
      id: 12,
      title: 'Body Core',
      text: "Head north from the previous two collectibles (towards Gate 6) and then head down the stairs to an underground area, before heading up the stairs straight ahead. At the far end of that area (north), near two explosive barrells and a Cosnia Kolzen sign is another human and another Body Core.",
    },
    {
      id: 13,
      title: 'Body Core',
      text: "Head southwest out of the Parking Tower and follow the alley around, on the corner is a small bar/pub with lights on inside. The Body Core is on a body inside the shop.",
    },
    {
      id: 14,
      title: 'Locked Legion Supply Chest',
      text: 'South of the parking lot, near the previous body core is a locked chest. Contains Omnibolt & Fixed Damage Gear.',
    },
    {
      id: 15,
      title: 'Robot - Drone Upgrade Module x2',
      text: 'In the same area as the previous collectibles. To the north by the fence/gate is a treasure/relic lootbot.',
    },
    {
      id: 16,
      title: "Memorystick - Legionnaire 302's Sorrow",
      text: 'From the camp, head left and head east this time. Next to the two enemies who ambush you past the bus, use the yellow box on the left to climb the wall and drop into the alley nearby. The human corpse and memorystick is at the west side of the alley.',
    },
    {
      id: 17,
      title: 'Legion Supply Box',
      text: 'North of gate 12, which is east and then north from the camp, is a Dozer and a car with a fusion core, this box is right next to the car.',
    },
    {
      id: 18,
      title: 'Memorystick - Request to Mother Sphere',
      text: 'East and then north from the camp (also north of gate 1), on the eastern wall, under cover, is a body with this memorystick.',
    },
    {
      id: 19,
      title: 'Legion Supply Box',
      text: "Head slightly north of the corpse and turn around and climb the side of the building. There's a supply crate up top.",
    }
  ]

  return (
    <CollectiblesSection
      id='parking-tower'
      title="Parking Tower"
      level="Eidos-7"
      location="Parking-Tower"
      staticContent={staticContent}
    />
  );
};

export default ParkingTower;
