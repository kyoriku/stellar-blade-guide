import { Compass } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { COLLECTIBLES } from '../constants/navigation';
import { COLLECTIBLE_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/collectibles',
  title: 'Collectibles',
  metaDescription: `Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade. Find every Document, Can, Memorystick, and more with screenshots and locations.`,
  intro: 'All collectible types in Stellar Blade including Cans, Documents, Memorysticks, Passcodes, and Camps. Found throughout every level with screenshots and detailed locations.',
  structuredDataHeadline: 'Stellar Blade Collectibles',
  structuredDataDescription: `Browse all ${COLLECTIBLES.length} collectible types in Stellar Blade.`,
  itemListName: 'Stellar Blade Collectible Types',
  items: COLLECTIBLES,
  images: COLLECTIBLE_IMAGES,
  fallbackIcon: Compass,
  prefetch: (fns, slug) => fns.prefetchCollectiblesByType(slug),
};

function CollectiblesIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default CollectiblesIndexPage;
