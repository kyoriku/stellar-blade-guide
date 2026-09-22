import { useState } from 'react'
import { type CollectibleImage } from '../services/api'
import { ZoomIn, Image as ImageIcon } from 'lucide-react'
import { loadedUrlCache } from '../utils/imageCache'
import { thumbnailUrl, buildSrcSet, predictRenderedWidth, gallerySizes, isValidGalleryImage } from '../utils/image'

interface ImageGalleryProps {
  images: CollectibleImage[];
  onImageClick?: (imageUrl: string) => void;
  /**
   * This gallery is above the fold on arrival. Every image in it loads eagerly
   * and paints at full opacity over its own skeleton; the first also gets
   * fetchpriority="high". Opt-in per gallery, because callers render one
   * gallery per item and only the first is worth prioritising.
   */
  priority?: boolean;
}

function ImageGallery({ images = [], onImageClick, priority = false }: ImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => {
    const validCount = images.filter(isValidGalleryImage).length;
    if (!validCount) return new Set<number>();
    const predictedWidth = predictRenderedWidth(validCount, window.innerWidth, window.devicePixelRatio);
    const cached = new Set<number>();
    images.forEach(img => {
      if (isValidGalleryImage(img) && loadedUrlCache.has(thumbnailUrl(img.url, predictedWidth))) {
        cached.add(img.id);
      }
    });
    return cached;
  });

  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  // Takes the element, not the event: React nulls SyntheticEvent.currentTarget
  // once the listener returns, so it has to be captured before the first await.
  const handleImageLoad = async (imageId: number, img: HTMLImageElement) => {
    loadedUrlCache.add(img.currentSrc);
    // `load` means the bytes arrived; decode() means a frame is ready to paint.
    // Waiting for the second is what keeps the backdrop underneath a picture
    // rather than underneath an empty box, and what spends the lazy fade on the
    // image. A rejection falls back to bytes-arrived — decode is an
    // optimisation, never a gate, since gating on it would leave an
    // undecodable-but-complete image pulsing forever.
    try { await img.decode(); } catch { /* fall back to bytes-arrived */ }
    // First write wins, so an image seeded from loadedUrlCache whose real load
    // event lands later does not re-render the whole gallery.
    setLoadedImages(prev => (prev.has(imageId) ? prev : new Set(prev).add(imageId)));
  };

  const validImages = images.filter(isValidGalleryImage);

  if (!validImages.length) return null;

  const isSingle = validImages.length === 1;
  const sizes = gallerySizes(images);

  return (
    <div className={`grid gap-3 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {validImages.map((image, idx) => {
        const isLoaded = loadedImages.has(image.id);
        const eager = priority;
        const highPriority = priority && idx === 0;
        const shown = isLoaded || eager;

        return (
          <div
            key={image.id}
            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer"
            onClick={() => onImageClick?.(image.url)}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            {/* RULE: the skeleton having no z-10 and the img having `relative`
                are ONE change. Never ship either half alone. Tailwind preflight
                makes the img display:block, so at opacity 1 it paints below a
                positioned z-auto sibling — `relative` is what lifts it above
                this backdrop, and z-10 is what would put the backdrop back on
                top. Drop either half and every lazy image on the site is buried
                under a gray rectangle. No new z-index is involved:
                position:relative with z-index:auto creates no stacking context,
                so the image still paints below fixed chrome like the mobile TOC.

                The backdrop never unmounts — that is what guarantees no frame
                can show an empty box, rather than relying on load timing. The
                pulse is paused rather than removed so it freezes where it is
                instead of snapping brighter, and the inline style is used so
                utility ordering cannot undo it. */}
            <div
              className="absolute inset-0 animate-pulse rounded-lg bg-gray-700 flex items-center justify-center"
              style={{ animationPlayState: isLoaded ? 'paused' : 'running' }}
            >
              {!isLoaded && <ImageIcon className="w-10 h-10 text-gray-600" />}
            </div>

            <img
              src={thumbnailUrl(image.url, isSingle ? 1200 : 960)}
              srcSet={buildSrcSet(image.url)}
              sizes={sizes}
              alt={image.alt}
              className={`relative w-full h-full object-cover transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
              onLoad={(e) => void handleImageLoad(image.id, e.currentTarget)}
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={highPriority ? 'high' : undefined}
            />

            {isLoaded && (
              <div>
                <div className={`absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute top-3 right-3">
                    <ZoomIn className={`w-5 h-5 text-gray-100 drop-shadow-lg transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-gray-100 text-sm font-medium drop-shadow-lg">
                      {image.alt}
                    </p>
                  </div>
                </div>
                <div className={`absolute inset-0 rounded-lg border transition-colors duration-200 ${hoveredImage === image.id ? 'border-gray-700' : 'border-transparent'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ImageGallery;