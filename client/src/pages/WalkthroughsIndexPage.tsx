import { Book } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { WALKTHROUGH_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/walkthroughs',
  title: 'Walkthroughs',
  metaDescription: `Complete walkthrough guides for Stellar Blade. Browse ${WALKTHROUGHS.length} categories including main story missions, side quests, and more.`,
  intro: 'Step-by-step walkthrough guides for Stellar Blade covering the main story, side quests, and more. Each guide includes screenshots, boss strategies, and tips.',
  structuredDataHeadline: 'Stellar Blade Walkthroughs',
  structuredDataDescription: 'Complete walkthrough guides for all Stellar Blade missions.',
  itemListName: 'Stellar Blade Walkthrough Categories',
  items: WALKTHROUGHS,
  images: WALKTHROUGH_IMAGES,
  fallbackIcon: Book,
  prefetch: (fns, slug) => fns.prefetchWalkthroughsByType(slug),
};

function WalkthroughsIndexPage() {
  return <CategoryIndexPage config={CONFIG} />;
}

export default WalkthroughsIndexPage;
