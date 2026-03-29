import { Image as ImageIcon } from 'lucide-react'

interface CollectibleSectionSkeletonProps {
  id: string;
  locationName?: string;
  cardCount?: number;
  hideTypeBadge?: boolean;
}

function CollectibleSectionSkeleton({
  id,
  locationName,
  cardCount = 2,
  hideTypeBadge = false,
}: CollectibleSectionSkeletonProps) {
  return (
    <section id={id} className="mb-16 scroll-mt-4">
      <div className="flex items-center gap-3 mb-5">
        {locationName ? (
          <span className="text-lg text-gray-400 whitespace-nowrap">{locationName}</span>
        ) : (
          <div className="h-7 w-48 bg-gray-700 rounded animate-pulse" />
        )}
        <div className="h-px flex-1 bg-gray-700" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <article
            key={index}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800"
          >
            <div className="relative">
              <div className="flex flex-col mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {!hideTypeBadge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 h-7.5 rounded-lg border border-cyan-500/50 bg-cyan-500/20">
                      <div className="w-3 h-3 bg-cyan-300/50 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-cyan-300/50 rounded animate-pulse" />
                    </div>
                  )}
                  <div className="h-[25px] w-2/3 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>

              <div className="mb-5">
                <div className="flex flex-col gap-2">
                  <div className="h-[22px] md:h-[26px] bg-gray-700 rounded animate-pulse" />
                  <div className="h-[22px] w-3/4 bg-gray-700 rounded animate-pulse md:hidden" />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-600" />
                  </div>
                </div>
                <div className="aspect-video overflow-hidden rounded-lg bg-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CollectibleSectionSkeleton;