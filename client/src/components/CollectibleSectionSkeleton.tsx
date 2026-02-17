import { Image as ImageIcon } from 'lucide-react'

interface CollectibleSectionSkeletonProps {
  id: string;
  locationName?: string;
  cardCount?: number;
}

function CollectibleSectionSkeleton({
  id,
  locationName,
  cardCount = 2,
}: CollectibleSectionSkeletonProps) {
  return (
    <section id={id} className="mb-16 scroll-mt-4">
      <div className="flex items-baseline gap-3 mb-6 md:mb-7">
        {locationName ? (
          <h2 className="text-2xl font-bold text-white">{locationName}</h2>
        ) : (
          <div className="h-8 w-48 bg-gray-700 rounded-lg animate-pulse" />
        )}
        <div className="h-5 w-20 bg-gray-700/50 rounded animate-pulse" />
        <span className="ml-auto">
          <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
        </span>
      </div>

      <div className="space-y-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <article
            key={index}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800"
          >
            <div className="relative">
              <div className="flex items-start gap-4 mb-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 h-7.5 rounded-lg border border-cyan-500/50 bg-cyan-500/20">
                    <div className="w-3 h-3 bg-cyan-300/50 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-cyan-300/50 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="h-7 w-2/3 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>

              <div className="mb-5 mt-0.5">
                <div className="flex flex-col gap-2">
                  <div className="h-5 md:h-6 bg-gray-700 rounded animate-pulse mb-1 md:mb-0.5" />
                  <div className="h-5 w-3/4 bg-gray-700 rounded animate-pulse md:hidden" />
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-500 animate-pulse" />
                  </div>
                </div>
                <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-500 animate-pulse" />
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