import { memo } from 'react'
import { type Collectible } from '../services/api'
import ImageGallery from './ImageGallery'
import TypeBadge from './TypeBadge';
import { FileText, List } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CollectibleSectionProps {
  id: string;
  title: string;
  levelName?: string;
  collectibles: Collectible[];
  onImageClick?: (imageUrl: string) => void;
  hideTypeBadge?: boolean;
  itemLabel?: string;
  isCompleted?: (id: number) => boolean;
  onToggleProgress?: (id: number) => void;
}

function parseDescription(text: string) {
  const parts = text.split(/(\[\[.*?\]\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.+?)\|(.+?)\]\]$/);
    if (match) {
      return <Link key={i} to={`/${match[1]}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{match[2]}</Link>;
    }
    return part;
  });
}

const CYCLE_STYLES: Record<string, string> = {
  'NG+': 'bg-purple-400/20 text-purple-400 border-purple-400/50',
  'NG++': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'DLC': 'bg-green-500/20 text-green-400 border-green-500/50',
};

function CollectibleSection({
  id,
  title,
  levelName,
  collectibles,
  onImageClick,
  hideTypeBadge = false,
  isCompleted,
  onToggleProgress,
}: CollectibleSectionProps) {
  if (!collectibles || collectibles.length === 0) {
    return (
      <section id={id} className="mb-16 scroll-mt-4">
        {title && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-lg text-gray-400 whitespace-nowrap">
              {levelName && levelName !== title ? (
                <>{levelName} <span className="text-gray-600">·</span> {title}</>
              ) : title}
            </span>
            <div className="h-px flex-1 bg-gray-700" />
          </div>
        )}
        <div className="bg-secondary rounded-lg p-8 border border-zinc-800">
          <p className="text-gray-400 text-center">No collectibles found for this location.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="mb-16 scroll-mt-4">
      {title && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-lg text-gray-400 whitespace-nowrap">
            {levelName && levelName !== title ? (
              <><span className="text-gray-300">{levelName}</span> <span className="text-cyan-600">·</span> {title}</>
            ) : title}
          </span>
          <div className="h-px flex-1 bg-gray-700" />
        </div>
      )}

      <div className="space-y-4">
        {collectibles.map((collectible) => (
          <article
            key={collectible.id}
            id={'_slug' in collectible ? (collectible as any)._slug : `collectible-${collectible.id}`}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/50"
          >
            <div className="relative">
              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    {!hideTypeBadge && [...collectible.types].sort().map((type, idx) => (
                      <TypeBadge key={idx} type={type} />
                    ))}
                    {collectible.cycle && collectible.cycle !== 'Base' && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold border whitespace-nowrap ${CYCLE_STYLES[collectible.cycle] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {collectible.cycle}
                      </span>
                    )}
                    <h3 className="text-xl font-semibold text-gray-100 leading-tight">
                      {collectible.title}
                      {collectible.quantity > 1 && (
                        <span className="ml-2 text-base font-medium text-cyan-400">x{collectible.quantity}</span>
                      )}
                    </h3>
                    {'_levelName' in collectible && (
                      <p className="w-full sm:w-auto text-sm text-gray-400 mt-1 sm:mt-0 pl-2 border-l border-gray-600">
                        <span className="text-gray-300">{(collectible as any)._levelName}</span>
                        {(collectible as any)._locationName !== (collectible as any)._levelName && (
                          <> <span className="text-cyan-600">·</span> {(collectible as any)._locationName}</>
                        )}
                      </p>
                    )}
                  </div>
                  {onToggleProgress && (
                    <button
                      onClick={() => onToggleProgress(collectible.id)}
                      className="flex-shrink-0 cursor-pointer"
                      title={isCompleted?.(collectible.id) ? 'Mark as not found' : 'Mark as found'}
                      aria-label={isCompleted?.(collectible.id) ? 'Mark as not found' : 'Mark as found'}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isCompleted?.(collectible.id)
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-gray-500 hover:border-gray-400'
                        }`}>
                        {isCompleted?.(collectible.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-5">
                {collectible.description.type === 'text' ? (
                  <div className="flex gap-3">
                    <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5 hidden" />
                    <div className="space-y-3">
                      {(collectible.description.content ?? '').split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="text-gray-300 leading-relaxed">
                          {parseDescription(paragraph)}
                        </p>
                      ))}
                    </div>
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

export default memo(CollectibleSection);