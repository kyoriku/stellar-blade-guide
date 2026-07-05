import { Box } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { MATERIALS } from '../constants/navigation';
import { MATERIAL_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/materials',
  title: 'Materials',
  metaDescription: `Browse all ${MATERIALS.length} material types in Stellar Blade. Find every Supply Box, Supply Chest, and Item with screenshots and locations.`,
  intro: 'All material items in Stellar Blade including Supply Boxes, Supply Chests, and miscellaneous items. Found throughout every level, often containing resources and upgrade materials.',
  structuredDataHeadline: 'Stellar Blade Materials',
  structuredDataDescription: `Browse all ${MATERIALS.length} material types in Stellar Blade.`,
  itemListName: 'Stellar Blade Material Types',
  items: MATERIALS,
  images: MATERIAL_IMAGES,
  fallbackIcon: Box,
  prefetch: (fns, slug) => fns.prefetchCollectiblesByType(slug, 'materials'),
};

function MaterialsIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default MaterialsIndexPage;
