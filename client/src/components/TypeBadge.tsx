import { Package } from 'lucide-react';

interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border border-blue-500/50 bg-blue-500/20 text-blue-100 whitespace-nowrap hover:border-blue-500 hover:bg-blue-500/20 transition-colors"
    >
      <Package className="w-3 h-3" />
      {type}
    </span>
  );
}

export default TypeBadge;