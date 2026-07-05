import { Sparkles } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { COSMETICS } from '../constants/navigation';
import { COSMETIC_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/cosmetics',
  title: 'Cosmetics',
  metaDescription: `Browse all ${COSMETICS.length} cosmetic types in Stellar Blade. Find every Nano Suit, Earring, and pair of Glasses with screenshots and locations.`,
  intro: 'All cosmetic items in Stellar Blade including Nano Suits, Glasses, Earrings, Hairstyles, Drone Appearances, and outfits for Lily and Adam. Most are found in chests, purchased from shops, or earned through quests.',
  structuredDataHeadline: 'Stellar Blade Cosmetics',
  structuredDataDescription: `Browse all ${COSMETICS.length} cosmetic types in Stellar Blade.`,
  itemListName: 'Stellar Blade Cosmetic Types',
  items: COSMETICS,
  images: COSMETIC_IMAGES,
  fallbackIcon: Sparkles,
  prefetch: (fns, slug) => fns.prefetchCollectiblesByType(slug, 'cosmetics'),
};

function CosmeticsIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default CosmeticsIndexPage;
