interface CollectibleSectionSkeletonProps {
  id: string;
  locationName?: string;
  cardCount?: number;
  animate?: boolean;
}

function CollectibleSectionSkeleton({
  id,
  locationName,
  cardCount = 2,
}: CollectibleSectionSkeletonProps) {
  return (
    <section id={id} className="mb-16 scroll-mt-4">
      {/* Enhanced Section Header - matches CollectibleSection exactly */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
        {locationName ? (
          <h2 className="text-3xl font-bold text-white">{locationName}</h2>
        ) : (
          <div className="h-9 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
        )}
        <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent ml-4"></div>
        <span className="text-sm font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          <div className="h-4 w-16 bg-gray-700 rounded animate-pulse"></div>
        </span>
      </div>

      {/* Collectible Cards Grid - matches actual cards */}
      <div className="space-y-4">
        {Array.from({ length: cardCount }).map((_, index) => (
          <article
            key={index}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800"
          // style={{
          //   animation: animate ? `fadeInUp 0.25s ease-out ${index * 0.05}s both` : 'none'
          // }}
          >
            {/* Decorative corner gradient - matches original */}
            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div> */}

            <div className="relative">
              {/* Header with Type Badges and Title - matches exact spacing */}
              <div className="flex items-start gap-4 mb-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  {/* Single Type badge skeleton - matches TypeBadge component */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 h-7.5 rounded-lg border border-blue-500 bg-blue-500/20">
                    <div className="w-3 h-3 bg-blue-300/50 rounded animate-pulse"></div>
                    <div className="h-4 w-16 bg-blue-300/50 rounded animate-pulse"></div>
                  </div>
                </div>
                {/* Title skeleton - matches h3 text-xl */}
                <div className="flex-1 pt-0.5">
                  <div className="h-7 bg-gray-700 rounded animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>

              {/* Description - matches exact structure with icon */}
              <div className="mb-5">
                <div className="flex gap-3">
                  {/* Icon placeholder */}
                  <div className="w-5 h-6 bg-gray-600 rounded flex-shrink-0 mt-0.5 animate-pulse"></div>
                  {/* Text lines */}
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
                    {/* <div className="h-5 bg-gray-700 rounded animate-pulse" style={{ width: '85%' }}></div> */}
                  </div>
                </div>
              </div>

              {/* Image Gallery skeleton - always 2 images */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    {/* <div className="w-12 h-12 bg-gray-500 rounded animate-pulse"></div> */}
                  </div>
                </div>
                <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse">
                  <div className="w-full h-full flex items-center justify-center">
                    {/* <div className="w-12 h-12 bg-gray-500 rounded animate-pulse"></div> */}
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