import ErrorMessage from "../../../components/ErrorMessage";
import SkeletonLoader from "../../../components/SkeletonLoader";
import MediaDisplay from "../../../components/MediaDisplay";
import { useCollectibles } from "../../../hooks/useCollectibles";
import { MapPin } from "lucide-react";

const AbandonedStation = () => {
  const staticContent = [
    {
      id: 1,
      title: "Memorystick - Respite of the Hopeful / Passcode - δβμκδβ",
      text: "After entering the flooded facility, to the right of the first door (north wall) is a corpse underwater with both this memorystick and passcode.",
    },
    {
      id: 2,
      title: "Supply Camp - Abandoned Station",
      text: "Up the elevator shaft in the Abandoned Station.",
    },
    {
      id: 3,
      title: "Memorystick - Legionnaire 244's Memory",
      text: "As you get out of the monorail on the other side.",
    },
    {
      id: 4,
      title: "Nano Suit - Planet Diving Suit (7th) V2",
      text: "In the southwest corner, in a small room, in the tram station at the beginning of the level (before heading outside towards the objective).",
    },
  ];

  const {
    data: collectibles = [],
    isLoading,
    error,
    refetch,
  } = useCollectibles("Eidos-7", "Abandoned-Station");

  return (
    <section>
      <hr id="abandoned-station"></hr>
      <div className="d-flex align-items-center">
        <MapPin className='text-secondary' size={32} />
        <h3 className="mb-0 ms-2">Abandoned Station</h3>
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

export default AbandonedStation;
