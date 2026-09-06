import { Zap } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { UPGRADES } from '../constants/navigation';
import { UPGRADE_IMAGES } from '../constants/categoryImages';
import seo from '../constants/seo.json';

const CONFIG: CategoryIndexConfig = {
  basePath: '/upgrades',
  title: 'Upgrades',
  seoTitle: seo.index['/upgrades'].title,
  metaDescription: seo.index['/upgrades'].description,
  intro: "All upgrade items in Stellar Blade including Beta Cores, Body Cores, Exospines, Tumbler Expansion Modules, Drone Upgrade Modules, Weapon Cores, and Gear. These items enhance Eve's abilities and equipment.",
  structuredDataHeadline: 'Stellar Blade Upgrades',
  structuredDataDescription: `Browse all ${UPGRADES.length} upgrade types in Stellar Blade.`,
  itemListName: 'Stellar Blade Upgrade Types',
  items: UPGRADES,
  images: UPGRADE_IMAGES,
  fallbackIcon: Zap,
  prefetch: (fns, slug) => fns.prefetchCollectiblesByType(slug, 'upgrades'),
};

function UpgradesIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default UpgradesIndexPage;
