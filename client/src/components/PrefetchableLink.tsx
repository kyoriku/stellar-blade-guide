import { Link } from 'react-router-dom'
import { usePrefetch } from '../hooks/usePrefetch'

// Keep in sync with the prefetch functions in hooks/usePrefetch.ts — each
// entry here must map to an existing prefetchQuery call with a matching key.
const PREFETCHABLE_CATEGORIES = ['collectibles', 'upgrades', 'materials', 'cosmetics'] as const;
type Category = typeof PREFETCHABLE_CATEGORIES[number];

function parsePrefetchTarget(to: string) {
  const withoutSlash = to.startsWith('/') ? to.slice(1) : to;
  const [pathPart, anchor] = withoutSlash.split('#');
  const [category, name, slug] = pathPart.split('/');
  if (!name) return null;
  if ((PREFETCHABLE_CATEGORIES as readonly string[]).includes(category)) {
    return { kind: 'type' as const, category: category as Category, typeName: name, anchor };
  }
  if (category === 'levels') {
    return { kind: 'level' as const, levelName: name, anchor };
  }
  if (category === 'walkthroughs' && slug) {
    return { kind: 'walkthrough' as const, walkthroughType: name, slug };
  }
  return null;
}

interface Props {
  to: string;
  className?: string;
  children: React.ReactNode;
}

function PrefetchableLink({ to, className, children }: Props) {
  const { prefetchCollectiblesByType, prefetchLevel, prefetchWalkthroughBySlug } = usePrefetch();

  const handleIntent = () => {
    const target = parsePrefetchTarget(to);
    if (!target) return;
    if (target.kind === 'type') prefetchCollectiblesByType(target.typeName, target.category, target.anchor);
    else if (target.kind === 'level') prefetchLevel(target.levelName, target.anchor);
    else prefetchWalkthroughBySlug(target.walkthroughType, target.slug);
  };

  return (
    <Link
      to={to}
      className={className}
      onMouseEnter={handleIntent}
      onTouchStart={handleIntent}
      onFocus={handleIntent}
    >
      {children}
    </Link>
  );
}

export default PrefetchableLink;
