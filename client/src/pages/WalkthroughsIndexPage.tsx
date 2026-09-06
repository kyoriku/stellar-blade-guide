import { Book } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { WALKTHROUGH_IMAGES } from '../constants/categoryImages';
import seo from '../constants/seo.json';

const CONFIG: CategoryIndexConfig = {
  basePath: '/walkthroughs',
  title: 'Walkthroughs',
  seoTitle: seo.index['/walkthroughs'].title,
  metaDescription: seo.index['/walkthroughs'].description,
  intro: 'Step-by-step walkthrough guides for Stellar Blade covering the main story, side quests, and more. Each guide includes screenshots and tips, and every boss fight gets its own strategy.',
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
