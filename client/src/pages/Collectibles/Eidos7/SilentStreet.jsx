import Header from "../../../components/Header";
import ContentText from "../../../components/ContentText";
import HrComponent from "../../../components/HrComponent";
import ErrorMessage from "../../../components/ErrorMessage";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { useCollectibles } from "../../../hooks/useCollectibles";
import { MapPin } from "lucide-react";

const SilentStreet = () => {
  const staticContent = [
    {
      id: 1,
      title: "Passcode - γθαγθα",
      text: "In the first garage/storage room on the left on Silent Street, where the Creepers crash out of the wall.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 451's Resolution",
      text: "After going through the gate, climb up to the right and follow that path to the end for this collectible.",
    },
    {
      id: 3,
      title: "Robot - Tumbler Expansion Module",
      text: "Southeast from where you are, follow the alleyway to the end and there'll be a robot there to destroy for loot.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "In the water after passing through the gate.",
    },
    {
      id: 5,
      title: "Legion Camp",
      text: "Back on Silent Street, down there on the left, near to where you just went swimming",
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "To the left of the bridge in a garage, before going across, where you fight your first Cricket Slasher - hit the car and loot the for the Micro Drive.",
    },
    {
      id: 7,
      title: "Legion Supply Box",
      text: "To the left, when you're halfway across the bridge. Jump over the gap to reach the rooftops and follow to the back.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "To the left of the bridge, drop down, kill the two Cricket Slashers and then the Hydra and open the box to the north. Inside is an Omnibolt, the Combo Attack Enhancement Gear (+14%).",
    },
    {
      id: 9,
      title: "Legion Supply Box",
      text: "To the right after the bridge, near where the Scan tutorial. Climb up near the scaffolding on the right hand side of the road to the top.",
    },
    {
      id: 10,
      title: "Beta Core",
      text: "After the ambush with the Mutated Creeper, Creepers and finally the Heavy Guardian, head down the alley to the north-northeast corner and follow it round to the left. There, near a Guardian, is the Beta Core (needed to upgrade your max beta energy).",
    },
    {
      id: 11,
      title: "Legion Supply Box",
      text: "Where the ambush took place, head up to the top of the building in the southeast, using the yellow ledges on the southeast wall.",
    },
    {
      id: 12,
      title: "Memorystick - The Last Words of the Hopeless / Passcode - βθακθγ",
      text: "Head the correct way after the ambush, and as you get onto the balcony, and before you grab onto the poles, there's a corpse on your left with this passcode and memorystick.",
    },
    {
      id: 13,
      title: "Legion Supply Box",
      text: "In the caged off area in the water section with the ladder. There's a hole in the fence you can use to get in.",
    },
    {
      id: 14,
      title: "Memorystick - Louis's Testimony",
      text: "In the same area as the water and the ladder, climb up the yellow ledges on the northwest wall of the building at the far end. There's a human corpse on the roof.",
    },
    {
      id: 15,
      title: "Legion Camp",
      text: "Up the ladder from the water will be a camp straight ahead.",
    },
    {
      id: 16,
      title: "Locked Legion Chest",
      text: "From the camp, head down the ladder and go west to Barker Drugs. The chest is in there.",
    },
    {
      id: 17,
      title: "Memorystick - Lament of Despair",
      text: "On a corpse in the back of the same room as the locked chest",
    },
    {
      id: 18,
      title: "Document - Series - Plastic Hearts, Volume 3",
      text: "After heading through the door (using the Fusion Cell), head left, defeat the Barnacle, and this document is a book on the shelf in the southeast corner.",
    },
  ];

  // Using custom hook to fetch collectibles
  const {
    data: collectibles = [],
    isLoading,
    error,
    refetch,
  } = useCollectibles("Eidos-7", "Silent-Street");

  return (
    <section>

      {/* <Header
        id="silent-street"
        title="Silent Street"
        icon={<MapPin className='text-secondary' size={32} />}
      /> */}

      <hr id="silent-street"></hr>
      <div className="d-flex align-items-center">
        <MapPin className='text-secondary' size={32} />
        <h3 className="mb-0 ms-2">Silent Street</h3>
      </div>
      <hr className="w-75"></hr>

      {/* Error handling with retry button */}
      {error && (
        <div>
          <ErrorMessage message="Failed to fetch collectibles. Please try again later." />
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Collectibles list */}
      <div>
        {staticContent.map((item, index) => (
          <article key={item.id} className="mb-6">

            {/* <ContentText title={item.title} text={item.text} /> */}

            {/* {Array.isArray(item.text) ? (
              <div>
                <strong>{item.title}</strong>
                <ul>
                  {item.text.map((textItem, idx) => (
                    <li key={idx}>{textItem}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>
                <strong>{item.title}</strong>
                <span> &#8211; </span>
                {item.text}
              </p>
            )} */}

            <p>
              <strong>{item.title}</strong>
              <span> &#8211; </span>
              {item.text}
            </p>

            {isLoading ? (
              <SkeletonLoader />
            ) : (
              <MediaDisplay
                images={collectibles.find((data) => data.id === item.id)?.images || []}
              />
            )}

            {/* <HrComponent
                          index={index}
                          isLoading={isLoading}
                          length={staticContent.length}
                        /> */}

            {index < staticContent.length - 1 && <hr />}
          </article>
        ))}
      </div>
    </section>
  );
};

export default SilentStreet;