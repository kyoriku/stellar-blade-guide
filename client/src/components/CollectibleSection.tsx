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
}

function CollectibleSection({
  id,
  title,
  levelName,
  collectibles,
  onImageClick,
}: CollectibleSectionProps) {
  if (!collectibles || collectibles.length === 0) {
    return (
      <section id={id} className="mb-16 scroll-mt-4">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {levelName && (
            <>
              <span className="hidden sm:inline text-gray-600">·</span>
              <span className="text-base text-gray-400">{levelName}</span>
            </>
          )}
        </div>
        <div className="bg-secondary rounded-lg p-8 border border-zinc-800">
          <p className="text-gray-400 text-center">No collectibles found for this location.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="mb-16 scroll-mt-4">
      <div className="flex flex-wrap items-baseline gap-3 mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {levelName && (
          <>
            <span className="hidden sm:inline text-cyan-600">•</span>
            <span className="text-base text-gray-400">{levelName}</span>
          </>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {collectibles.length} {collectibles.length === 1 ? 'collectible' : 'collectibles'}
        </span>
      </div>

      <div className="space-y-4">
        {collectibles.map((collectible) => (
          <article
            key={collectible.id}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/50"
          >
            <div className="relative">
              <div className="flex flex-col mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[...collectible.types].sort().map((type, idx) => (
                    <TypeBadge key={idx} type={type} />
                  ))}
                  <h3 className="text-xl font-semibold text-gray-100 leading-tight ">
                    {collectible.title}
                  </h3>
                </div>
              </div>

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

              <ImageGallery
                images={collectible.images}
                onImageClick={onImageClick}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CollectibleSection;