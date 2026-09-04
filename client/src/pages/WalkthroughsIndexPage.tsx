import { Book } from 'lucide-react';
import CategoryIndexPage, { type CategoryIndexConfig } from '../components/CategoryIndexPage';
import { WALKTHROUGHS } from '../constants/navigation';
import { WALKTHROUGH_IMAGES } from '../constants/categoryImages';

const CONFIG: CategoryIndexConfig = {
  basePath: '/walkthroughs',
  title: 'Walkthroughs',
  seoTitle: 'Main Story & Side Quest Walkthroughs',
  metaDescription: 'Step-by-step walkthroughs for every Stellar Blade main story mission, side quest, and bulletin board request, plus the NieR: Automata and Goddess of Victory: Nikke DLC.',
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
