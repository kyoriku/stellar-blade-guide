import { useState } from 'react'
import { type CollectibleImage } from '../services/api'
import { ZoomIn, Image as ImageIcon } from 'lucide-react'

interface ImageGalleryProps {
  images: CollectibleImage[];
  onImageClick?: (imageUrl: string) => void;
  // showSkeleton?: boolean;
}

function ImageGallery({ images = [], onImageClick }: ImageGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  // Filter out invalid images
  const validImages = images.filter(img => img.url && img.alt);

  if (!validImages.length) return null;

  const handleImageLoad = (imageId: number) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  return (
    <div className={`grid gap-3 ${validImages.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {validImages.map((image) => {
        const isLoaded = loadedImages.has(image.id);
        const shouldShowSkeleton = !isLoaded;

        return (
          <div
            key={image.id}
            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer"
            onClick={() => onImageClick?.(image.url)}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            {/* Skeleton loader - pixel perfect */}
            {shouldShowSkeleton && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse z-10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Image - loads underneath skeleton */}
            <img
              src={image.url}
              alt={image.alt}
              className={`w-full h-full object-cover transition-all duration-300 ${shouldShowSkeleton ? 'opacity-0' : 'opacity-100'
                } ${hoveredImage === image.id ? 'scale-100' : 'scale-100'}`}
              onLoad={() => handleImageLoad(image.id)}
              loading="lazy"
            // fetchPriority='high'
            />

            {/* Overlay on hover - only show when image is loaded */}
            {isLoaded && (
              <div className={`absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
                }`}>
                {/* Zoom Icon */}
                <div className="absolute top-3 right-3">
                  <ZoomIn className={`w-5 h-5 text-white drop-shadow-lg transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
                    }`} />
                </div>

                {/* Alt text at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-200 ${hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                  <p className="text-white text-sm font-medium drop-shadow-lg">
                    {image.alt}
                  </p>
                </div>
              </div>
            )}

            {/* Subtle border on hover - only show when image is loaded */}
            {isLoaded && (
              <div className={`absolute inset-0 rounded-lg border transition-colors duration-200 ${hoveredImage === image.id ? 'border-gray-700' : 'border-transparent'
                }`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ImageGallery;