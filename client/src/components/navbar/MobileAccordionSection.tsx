import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MobileNavLink from './MobileNavLink';
import type { NavSection } from './navSections';

interface MobileAccordionSectionProps {
  section: NavSection;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  prefetchItem: (slug: string) => void;
}

function MobileAccordionSection({ section, isOpen, onToggle, onNavigate, prefetchItem }: MobileAccordionSectionProps) {
  const { icon: Icon, label, basePath, items, itemActiveMatch, mobileMaxH } = section;

  return (
    <div className="border-b border-gray-800/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-secondary/30 transition-colors group active:bg-secondary/50"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-400/10 rounded-lg">
            <Icon className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-semibold text-white text-base">{label}</span>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <div className={`section-content overflow-hidden ${isOpen ? `${mobileMaxH} opacity-100` : 'max-h-0 opacity-0'}`}>
        <div className="space-y-0.5 pb-2 px-2">
          <Link
            to={basePath}
            onClick={onNavigate}
            className="block py-3.5 px-8 rounded-lg font-semibold text-[15px] transition-all duration-200 min-h-[52px] flex items-center text-cyan-400 hover:bg-gray-800/40 hover:text-cyan-300 border-l-4 border-cyan-400/30 hover:border-cyan-400 bg-gray-800/20"
          >
            View all {label}
          </Link>
          {items.map((item, index) => (
            <MobileNavLink
              key={item.slug}
              to={`${basePath}/${item.slug}`}
              matchMode={itemActiveMatch}
              onClick={onNavigate}
              onMouseEnter={() => prefetchItem(item.slug)}
              onTouchStart={() => prefetchItem(item.slug)}
              indent
              style={{ animation: isOpen ? `slideIn 0.2s ease-out ${index * 0.05}s both` : 'none' }}
            >
              {item.name}
            </MobileNavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobileAccordionSection;
