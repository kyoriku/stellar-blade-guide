import { Link } from 'react-router-dom';
import type { ElementType } from 'react';
import { buildSrcSet, thumbnailUrl } from '../utils/cloudinary';

const SIZES = '(min-width: 1024px) calc(33vw - 2rem), calc(50vw - 2rem)';

interface CategoryCardProps {
  to: string;
  imageUrl: string | undefined;
  name: string;
  FallbackIcon: ElementType<{ className?: string }>;
  onMouseEnter?: () => void;
}

export default function CategoryCard({ to, imageUrl, name, FallbackIcon, onMouseEnter }: CategoryCardProps) {
  return (
    <Link to={to} onMouseEnter={onMouseEnter} className="group block">
      <div
        className="relative aspect-4/3 sm:aspect-video rounded-lg overflow-hidden border border-zinc-800
                    hover:border-zinc-600 transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
      >
        {imageUrl ? (
          <img
            src={thumbnailUrl(imageUrl)}
            srcSet={buildSrcSet(imageUrl)}
            sizes={SIZES}
            alt={name}
            className="w-full h-full object-cover"
            loading='lazy'
          />
        ) : (
          <div className="w-full h-full bg-tertiary flex items-center justify-center">
            <FallbackIcon className="w-12 h-12 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent" />
        <span className="absolute bottom-3 left-4 text-lg font-semibold text-gray-100 drop-shadow-lg">
          {name}
        </span>
      </div>
    </Link>
  );
}
