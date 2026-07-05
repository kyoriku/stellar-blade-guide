import { Zap } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { UPGRADES } from '../constants/navigation';
import { UPGRADE_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/upgrades',
  title: 'Upgrades',
  metaDescription: `Browse all ${UPGRADES.length} upgrade types in Stellar Blade. Find every Beta Core, Body Core, and Exospine with screenshots and locations.`,
  intro: "All upgrade items in Stellar Blade including Beta Cores, Body Cores, Exospines, Tumbler Expansion Modules, and Drone Upgrade Modules. These items enhance Eve's abilities and equipment.",
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
