import { Link } from 'react-router-dom';
import { Compass, Zap, Sparkles, Box } from 'lucide-react';
import { COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from '../constants/navigation';
import { usePrefetch } from '../hooks/usePrefetch';

function getTypeInfo(type: string) {
  const collectible = COLLECTIBLES.find(c => c.name.startsWith(type));
  if (collectible) return { Icon: Compass, to: `/collectibles/${collectible.slug}`, slug: collectible.slug, category: 'collectibles' };

  const upgrade = UPGRADES.find(u => u.name.startsWith(type));
  if (upgrade) return { Icon: Zap, to: `/upgrades/${upgrade.slug}`, slug: upgrade.slug, category: 'upgrades' };

  const cosmetic = COSMETICS.find(c => c.name.startsWith(type));
  if (cosmetic) return { Icon: Sparkles, to: `/cosmetics/${cosmetic.slug}`, slug: cosmetic.slug, category: 'cosmetics' };

  const material = MATERIALS.find(m => m.name.startsWith(type));
  if (material) return { Icon: Box, to: `/materials/${material.slug}`, slug: material.slug, category: 'materials' };

  return { Icon: Compass, to: null, slug: null, category: null };
}

interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const { Icon, to, slug, category } = getTypeInfo(type);
  const { prefetchCollectiblesByType } = usePrefetch();

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border border-cyan-500/50 bg-cyan-500/20 text-gray-100 whitespace-nowrap transition-colors ${to ? 'hover:border-cyan-500 hover:bg-cyan-500/30' : ''}`}
    >
      <Icon size={18} className="text-cyan-400" />
      {type}
    </span>
  );

  if (to && slug && category) {
    return (
      <Link
        to={to}
        onMouseEnter={() => prefetchCollectiblesByType(slug, category)}
      >
        {badge}
      </Link>
    );
  }

  return badge;
}

export default TypeBadge;