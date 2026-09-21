import { useState } from 'react'
import { type CollectibleImage } from '../services/api'
import { ZoomIn, Image as ImageIcon } from 'lucide-react'
import { loadedUrlCache } from '../utils/imageCache'
import { thumbnailUrl, buildSrcSet, predictRenderedWidth, SINGLE_SIZES, GRID_SIZES } from '../utils/image'

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
    const validCount = images.filter(img => img.url && img.alt).length;
    if (!validCount) return new Set<number>();
    const predictedWidth = predictRenderedWidth(validCount, window.innerWidth, window.devicePixelRatio);
    const cached = new Set<number>();
    images.forEach(img => {
      if (img.url && img.alt && loadedUrlCache.has(thumbnailUrl(img.url, predictedWidth))) {
        cached.add(img.id);
      }
    });
    return cached;
  });

  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  const handleImageLoad = (imageId: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    loadedUrlCache.add(e.currentTarget.currentSrc);
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  const validImages = images.filter(img => img.url && img.alt);

  if (!validImages.length) return null;

  const isSingle = validImages.length === 1;
  const sizes = isSingle ? SINGLE_SIZES : GRID_SIZES;

  return (
    <div className={`grid gap-3 ${isSingle ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {validImages.map((image, idx) => {
        const isLoaded = loadedImages.has(image.id);
        const eager = priority;
        const highPriority = priority && idx === 0;
        // Only the opacity class — the skeleton still unmounts on load, so an
        // eager image paints over its pulse instead of over an empty box.
        const shown = isLoaded || eager;

        return (
          <div
            key={image.id}
            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer"
            onClick={() => onImageClick?.(image.url)}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            {/* An eager image drops the skeleton's z-10 and positions itself
                instead, so DOM order alone stacks skeleton -> image -> hover.
                No new z-index: position:relative with z-index:auto creates no
                stacking context, so the image still paints below fixed chrome
                like the mobile TOC. */}
            {!isLoaded && (
              <div className={`absolute inset-0 ${eager ? '' : 'z-10 '}rounded-lg bg-gray-700 animate-pulse flex items-center justify-center`}>
                <ImageIcon className="w-10 h-10 text-gray-600" />
              </div>
            )}

            <img
              src={thumbnailUrl(image.url, isSingle ? 1200 : 960)}
              srcSet={buildSrcSet(image.url)}
              sizes={sizes}
              alt={image.alt}
              className={`${eager ? 'relative ' : ''}w-full h-full object-cover transition-opacity duration-300 ${shown ? 'opacity-100' : 'opacity-0'}`}
              onLoad={(e) => handleImageLoad(image.id, e)}
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