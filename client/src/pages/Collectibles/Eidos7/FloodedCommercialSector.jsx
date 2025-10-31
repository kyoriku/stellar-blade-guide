import Header from "../../../components/Header";
import ErrorMessage from "../../../components/ErrorMessage";
import ContentText from "../../../components/ContentText";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import HrComponent from "../../../components/HrComponent";
import { useCollectibles } from "../../../hooks/useCollectibles";
import { MapPin } from "lucide-react";

const FloodedCommercialSector = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Camp",
      text: "At the base of the stairs leading out of the monorail station.",
    },
    {
      id: 2,
      title: "Memorystick - Legionnaire 272's Eyewitness Account",
      text: "Head north from the bottom of the monorail stairs (away from the objective), and there's a corpse there on the left with this memory stick.",
    },
    {
      id: 3,
      title: "Beta Core",
      text: "Further north, near the northernmost chainlink fence is a corpse with this Beta Core.",
    },
    {
      id: 4,
      title: "Legion Supply Box",
      text: "Northeast of the monorail station, over the river, head into the far northeast corner. Drop down onto the ledges and shimmy to the east. You'll reach a plaza with a Mutated Hydra. In the east corner is Caliente, a store with this supply box.",
    },
    {
      id: 5,
      title: "Grenadier-Type Exospine",
      text: "On the northern side of the plaza is a walkway. At the end is a crate with this Exospine in it.",
    },
    {
      id: 6,
      title: "Passcode - ααμθβθ",
      text: "Head back across the ledges you used to get to this plaza and continue south. Climb up the yellow grabbable ledges and there'll be a group of stone monsters (1 real) by this corpse, underneath the Barker Drugs sign.",
    },
    {
      id: 7,
      title: "Supply Camp - Plaza Entryway",
      text: "After using the passcode to unlock the 317 gate, head through and the supply camp is straight ahead.",
    },
    {
      id: 8,
      title: "Legion Supply Box",
      text: "East of the plaza entryway camp, by an enemy ambush of sorts. Hard to miss this one.",
    },
    {
      id: 9,
      title: "Memorystick - Memory of a Believer",
      text: "Further east from the supply box, to the right of the ladder.",
    },
    {
      id: 10,
      title: "Memorystick - Legionnaire 249's Memory",
      text: "In the next area, having dropped down after climbing up, in the north corner there's a pool with lily pads. The corpse is in the water.",
    },
    {
      id: 11,
      title: "Memorystick - Bitter Suicide Note",
      text: "After using the clock to open the Club Bpemr door (1225), there's a corpse straight ahead, near a teapot and a small camp.",
    },
    {
      id: 12,
      title: "Legion Camp",
      text: "After climbing the ladder and dropping down, there's a camp to the west.",
    },
    {
      id: 13,
      title: "Memorystick - Max's Memory",
      text: "To the northeast of the camp, up the stairs, there's a corpse there near a statue.",
    },
    {
      id: 14,
      title: "Armoured Pack (Drone Skin/Appearance Pack)",
      text: "Before heading up and over the bridge to the otherside of the abyss, from the camp head west and down. Use the poles to cross the gap and you'll come to an area with a Barnacle. Defeat it, and in a small enclosure to the southwest is this skin).",
    },
    {
      id: 15,
      title: "Beta Core",
      text: "In the same area as the drone skin, on the northside, is a corpse with this beta core.",
    }
  ];

  const {
    data: collectibles = [],
    isLoading,
    error,
    refetch,
  } = useCollectibles("Eidos-7", "Flooded-Commercial-Sector");

  return (
    <section>
      <hr id="flooded-commercial-sector"></hr>
      <div className="d-flex align-items-center">
        <MapPin className='text-secondary' size={32} />
        <h3 className="mb-0 ms-2">Flooded Commercial Sector</h3>
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

            {index < staticContent.length - 1 && <hr />}
          </article>
        ))}
      </div>
    </section>
  );
};

export default FloodedCommercialSector;
