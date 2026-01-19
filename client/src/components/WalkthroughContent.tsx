import { type WalkthroughContent as WalkthroughContentType } from '../services/api'
import { Lightbulb, AlertTriangle, Skull } from 'lucide-react'
import ImageGallery from './ImageGallery'

interface WalkthroughContentProps {
  content: WalkthroughContentType;
  onImageClick: (imageUrl: string) => void;
}

function WalkthroughContent({ content, onImageClick }: WalkthroughContentProps) {
  // Transform ContentImage to CollectibleImage format (add id field)
  const galleryImages = content.images.map(img => ({
    id: img.order,
    url: img.url,
    alt: img.alt,
    order: img.order
  }));

  return (
    <article className="relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300">
      <div className="relative">
        {/* Section Title */}
        {content.section_title && (
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-gray-100">
            {content.is_boss && <Skull className="w-5 h-5 text-red-400" />}
            {content.section_title}
          </h3>
        )}

        {/* Main text */}
        <p className="text-gray-300 leading-relaxed mb-4">
          {content.text}
        </p>

        {/* Tip */}
        {content.tip && (
          <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-blue-200 text-sm leading-relaxed">{content.tip}</p>
          </div>
        )}

        {/* Warning */}
        {content.warning && (
          <div className="flex gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-yellow-200 text-sm leading-relaxed">{content.warning}</p>
          </div>
        )}

        {/* Boss Info */}
        {content.is_boss && content.boss_info && (
          <div className="mb-4 p-4 bg-tertiary rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Skull className="w-5 h-5 text-red-400" />
              <h4 className="font-semibold text-white">{content.boss_info.name}</h4>
              {content.boss_info.balance_diamonds && (
                <span className="text-sm text-gray-400 ml-auto">
                  {content.boss_info.balance_diamonds} Balance Diamonds
                </span>
              )}
            </div>

            {content.boss_info.key_attacks && content.boss_info.key_attacks.length > 0 && (
              <>
                <p className="text-gray-400 mb-2 text-sm">Key Attacks:</p>
                <ul className="space-y-1.5">
                  {content.boss_info.key_attacks.map((attack, idx) => (
                    <li key={idx} className="flex gap-2 text-gray-300 text-sm">
                      <span className="text-red-400 font-bold">•</span>
                      <span className="flex-1">{attack}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Images - using ImageGallery component */}
        {galleryImages.length > 0 && (
          <ImageGallery
            images={galleryImages}
            onImageClick={onImageClick}
          />
        )}
      </div>
    </article>
  );
}

export default WalkthroughContent;