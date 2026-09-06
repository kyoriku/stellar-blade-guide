import { Map } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { LEVELS } from '../constants/navigation';
import { LEVEL_IMAGES } from '../constants/categoryImages';
import seo from '../constants/seo.json';

const CONFIG: CategoryIndexConfig = {
  basePath: '/levels',
  title: 'Levels',
  seoTitle: seo.index['/levels'].title,
  metaDescription: seo.index['/levels'].description,
  intro: `All ${LEVELS.length} levels in Stellar Blade with every collectible organized by location. Each level page includes Camps, Cans, Documents, Memorysticks, Nano Suits, and more - with screenshots and detailed directions.`,
  structuredDataHeadline: 'Stellar Blade Levels',
  structuredDataDescription: 'Browse all Stellar Blade levels and find every collectible organized by location.',
  itemListName: 'Stellar Blade Levels',
  items: LEVELS,
  images: LEVEL_IMAGES,
  fallbackIcon: Map,
  prefetch: (fns, slug) => fns.prefetchLevel(slug),
};

function LevelsIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default LevelsIndexPage;
