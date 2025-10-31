import ErrorMessage from "../../../components/ErrorMessage";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { useCollectibles } from "../../../hooks/useCollectibles";
import { MapPin } from "lucide-react";

const MemoryTower = () => {
  const staticContent = [
    {
      id: 1,
      title: "Legion Supply Box",
      text: "Northwest of where you enter the plaza, down a metal walkway, and into an alleyway. The box is there.",
    },
    {
      id: 2,
      title: "Memorystick - Artemis 132's Credentials",
      text: "South of the pillar (that leads to the Hall of Records) you see when you get into the area is a corpse.",
    },
    {
      id: 3,
      title: "Memorystick - Artemis 8's Orders / Passcode - λμακθκ",
      text: "To the east of the pillar in the plaza is another corpse.",
    },
    {
      id: 4,
      title: "Memorystick - Artemis 49's Reply",
      text: "On the south side of the area where you fought the Corrupter is a corpse with this memorystick.",
    },
    {
      id: 5,
      title: "Beta Core",
      text: "In Northeast corner of the Corrupter battle area there's an alleyway. Head down it slightly (just down the stairs), and to the right is a corpse with this Beta Core on it. Inside The Red Grill (with flashing neon 'closed' sign).",
    },
    {
      id: 6,
      title: "Legion Supply Box",
      text: "In the northeast corner of the upstairs area is a Legion Supply Box.",
    },
    {
      id: 7,
      title: "Robot - Tumbler Expansion Module",
      text: "At the end of the road (don't go up the ladder yet) is a relic robot. Destroy it to get the Tumbler Expansion Module.",
    },
    {
      id: 8,
      title: "Legion Camp",
      text: "Up the ladder and to the north is the next camp.",
    },
    {
      id: 9,
      title: "Memorystick - Legionnaire 214's Testament",
      text: "Just to the north of the camp is a corpse with this memorystick.",
    }
  ]

  const {
    data: collectibles = [],
    isLoading,
    error,
    refetch,
  } = useCollectibles("Eidos-7", "Memory-Tower");

  return (
    <section>
      <hr id="memory-tower"></hr>
      <div className="d-flex align-items-center">
        <MapPin className='text-secondary' size={32} />
        <h3 className="mb-0 ms-2">Memory Tower</h3>
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

export default MemoryTower;
