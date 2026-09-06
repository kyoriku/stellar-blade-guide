import { Box } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { MATERIALS } from '../constants/navigation';
import { MATERIAL_IMAGES } from '../constants/categoryImages';
import seo from '../constants/seo.json';

const CONFIG: CategoryIndexConfig = {
  basePath: '/materials',
  title: 'Materials',
  seoTitle: seo.index['/materials'].title,
  metaDescription: seo.index['/materials'].description,
  intro: 'All materials in Stellar Blade: 151 Supply Boxes and 42 Supply Chests, found throughout every level and often holding resources and upgrade materials.',
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
