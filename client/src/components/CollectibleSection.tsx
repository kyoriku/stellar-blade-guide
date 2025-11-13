import { type Collectible } from '../services/api'
import ImageGallery from './ImageGallery'
import TypeBadge from './TypeBadge';
import { FileText, List } from 'lucide-react'

interface CollectibleSectionProps {
  id: string;
  title: string;
  levelName?: string;
  collectibles: Collectible[];
  onImageClick?: (imageUrl: string) => void;
  isInitialLoad?: boolean;
}

function CollectibleSection({
  id,
  title,
  levelName,
  collectibles,
  onImageClick,
  isInitialLoad = true
}: CollectibleSectionProps) {
  if (!collectibles || collectibles.length === 0) {
    return (
      <section id={id} className="mb-16 scroll-mt-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700">
          <p className="text-gray-400 text-center">No collectibles found for this location.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="mb-16 scroll-mt-4">
      {/* Enhanced Section Header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        {levelName && (
          <>
            <span className="hidden sm:inline text-2xl text-gray-600">•</span>
            <span className="text-lg font-medium text-gray-400">{levelName}</span>
          </>
        )}
        <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent ml-4"></div>
        <span className="text-sm font-medium text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          {collectibles.length} {collectibles.length === 1 ? 'collectible' : 'collectibles'}
        </span>
      </div>

      {/* Collectible Cards Grid */}
      <div className="space-y-4">
        {/* {collectibles.map((collectible, index) => ( */}
        {collectibles.map((collectible) => (
          <article
            key={collectible.id}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/50"
            // style={{
            //   animation: isInitialLoad ? 'none' : `fadeInUp 0.25s ease-out ${index * 0.025}s both`
            // }}
          >
            {/* Decorative corner gradient */}
            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500"></div> */}

            <div className="relative">
              {/* Header with Type Badges and Title */}
              {/* <div className="flex items-start gap-4 mb-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  {[...collectible.types].sort().map((type, idx) => (
                    <TypeBadge key={idx} type={type} />
                  ))}
                </div>
                <h3 className="text-xl font-semibold text-gray-100 flex-1 leading-tight pt-1">
                  {collectible.title}
                </h3>
              </div> */}
              <div className="flex flex-col mb-4">
  {/* Left side: badges and title stacked nicely */}
  <div className="flex flex-wrap items-center gap-2">
    {[...collectible.types].sort().map((type, idx) => (
      <TypeBadge key={idx} type={type} />
    ))}
    <h3 className="text-xl font-semibold text-gray-100 leading-tight ">
      {collectible.title}
    </h3>
  </div>

  {/* Optional: collectible count or icon cluster */}
</div>


              {/* Description */}
              <div className="mb-5">
                {collectible.description.type === 'text' ? (
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5 hidden" />
                    <p className="text-gray-300 leading-relaxed">{collectible.description.content}</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <List className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <ul className="space-y-2 text-gray-300 flex-1">
                      {collectible.description.items?.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-blue-400 font-bold">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Image Gallery with enhanced styling */}
              <ImageGallery
                images={collectible.images}
                onImageClick={onImageClick}
                showSkeleton={isInitialLoad}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CollectibleSection;