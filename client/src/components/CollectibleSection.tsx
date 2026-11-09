import { memo } from 'react'
import { type Collectible } from '../services/api'
import ImageGallery from './ImageGallery'
import TypeBadge from './TypeBadge';
import { FileText, List } from 'lucide-react'
import { parseDescription } from '../utils/parseDescription'
import { textBlocks } from '../utils/textBlocks'
import { cycleLabel } from '../constants/cycleLabels'
import type { ImageClickHandler } from '../hooks/usePageLightbox'

// CollectibleTypeDetailPage augments collectibles with presentation-only
// fields: a pre-deduped anchor slug, and (in A–Z sort) origin level/location.
export type AnnotatedCollectible = Collectible & {
  _slug?: string;
  _levelName?: string;
  _locationName?: string;
};

interface CollectibleSectionProps {
  id: string;
  title: string;
  levelName?: string;
  collectibles: AnnotatedCollectible[];
  onImageClick?: ImageClickHandler;
  hideTypeBadge?: boolean;
  /** Collectible whose gallery is above the fold — see ImageGallery's `priority`. */
  priorityId?: number;
  isCompleted?: (id: number) => boolean;
  isToggling?: (id: number) => boolean;
  onToggleProgress?: (id: number) => void;
}

const CYCLE_STYLES: Record<string, string> = {
  'NG+': 'bg-purple-400/20 text-purple-400 border-purple-400/50',
  'NG++': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'DLC': 'bg-green-500/20 text-green-400 border-green-500/50',
};

// "Level · Location": too wide for its line, it breaks after the dot and the divider follows the location.
function LocationHeading({ levelName, title, empty = false }: { levelName?: string; title: string; empty?: boolean }) {
  const level = levelName && levelName !== title ? levelName : null;
  return (
    <div className={`flex flex-wrap items-center text-lg ${empty ? 'mb-5 text-gray-400' : 'mb-4 text-gray-300'}`}>
      {level && (
        <span>
          {empty ? level : <span className="text-gray-200">{level}</span>}{' '}
          <span className={empty ? 'text-gray-600' : 'text-cyan-600'}>·</span>{' '}
        </span>
      )}
      <span className="flex flex-auto items-center min-w-0">
        <span className={level || empty ? 'min-w-0 text-balance' : 'min-w-0 text-balance text-gray-200'}>{title}</span>
        {/* Absolute, so the line and its gap add nothing to the width the wrap is decided on. */}
        <span className="relative flex-1 self-stretch">
          <span className={`absolute left-3 right-0 top-[calc(50%-0.5px)] h-px ${empty ? 'bg-gray-700' : 'bg-linear-to-r from-gray-700 to-transparent'}`} />
        </span>
      </span>
    </div>
  );
}

function CollectibleSection({
  id,
  title,
  levelName,
  collectibles,
  onImageClick,
  hideTypeBadge = false,
  priorityId,
  isCompleted,
  isToggling,
  onToggleProgress,
}: CollectibleSectionProps) {
  if (!collectibles || collectibles.length === 0) {
    return (
      <section id={id} className="mb-8 scroll-anchor">
        {title && <LocationHeading levelName={levelName} title={title} empty />}
        <div className="bg-secondary rounded-lg p-8 border border-zinc-800">
          <p className="text-gray-400 text-center">No collectibles found for this location.</p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="mb-8 scroll-anchor">
      {title && <LocationHeading levelName={levelName} title={title} />}

      <div className="space-y-8">
        {/* The page's lightbox (usePageLightbox) walks these cards in this order. */}
        {collectibles.map((collectible) => (
          <article
            key={collectible.id}
            id={collectible._slug ?? `collectible-${collectible.id}`}
            className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 scroll-anchor"
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
                        {cycleLabel(collectible.cycle)}
                      </span>
                    )}
                    {/* Focusable, so a link that lands on this card can hand focus here (useHashJump). */}
                    <h2 tabIndex={-1} className="text-xl font-semibold text-gray-100 leading-tight">
                      {collectible.title.includes(' / ') ? (
                        collectible.title.split(' / ').map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && <span className="text-gray-400 font-normal mx-1"> / </span>}
                          </span>
                        ))
                      ) : collectible.title}
                      {collectible.quantity > 1 && (
                        <span className="ml-2 text-base font-medium text-gray-100">x{collectible.quantity}</span>
                      )}
                    </h2>
                    {collectible._levelName && (
                      <p className="w-full sm:w-auto text-sm text-gray-300 mt-1 sm:mt-0 pl-2 border-l border-gray-600">
                        <span className="text-gray-200">{collectible._levelName}</span>
                        {collectible._locationName !== collectible._levelName && (
                          <> <span className="text-cyan-600">·</span> {collectible._locationName}</>
                        )}
                      </p>
                    )}
                  </div>
                  {onToggleProgress && (
                    <button
                      onClick={() => onToggleProgress(collectible.id)}
                      disabled={isToggling?.(collectible.id)}
                      className="flex-shrink-0 cursor-pointer disabled:cursor-default disabled:opacity-60"
                      title={isCompleted?.(collectible.id) ? 'Mark as not found' : 'Mark as found'}
                      aria-label={isCompleted?.(collectible.id) ? 'Mark as not found' : 'Mark as found'}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isCompleted?.(collectible.id)
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-gray-400 hover:border-gray-300'
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
                      {textBlocks(collectible.description.content ?? '').map((block, idx) =>
                        block.kind === 'list' ? (
                          // The walkthrough text list's markup, so both read alike.
                          <ul key={idx} className="space-y-1.5">
                            {block.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex gap-2 text-gray-300 leading-relaxed">
                                <span className="text-cyan-400 font-bold">•</span>
                                <span className="flex-1">{parseDescription(item)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p key={idx} className="text-gray-300 leading-relaxed">
                            {parseDescription(block.text)}
                          </p>
                        )
                      )}
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
                galleryKey={collectible.id}
                onImageClick={onImageClick}
                priority={collectible.id === priorityId}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(CollectibleSection);