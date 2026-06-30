import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavSection } from './navSections';

interface DesktopDropdownProps {
  section: NavSection;
  isOpen: boolean;
  isActiveCategory: boolean;
  pathname: string;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  prefetchItem: (slug: string) => void;
}

function DesktopDropdown({ section, isOpen, isActiveCategory, pathname, onOpen, onClose, onToggle, prefetchItem }: DesktopDropdownProps) {
  const { label, basePath, items, itemActiveMatch, scrollable } = section;

  const isItemActive = (slug: string) =>
    itemActiveMatch === 'prefix'
      ? pathname.startsWith(`${basePath}/${slug}`)
      : pathname === `${basePath}/${slug}`;

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onClick={onClose}
    >
      <div className={`flex items-center gap-1 px-4 py-2 rounded-lg hover:text-cyan-400 hover:bg-gray-800/50 ${isActiveCategory ? 'text-cyan-400' : 'text-gray-300'
        }`}>
        <Link to={basePath} className="hover:text-cyan-400 transition-colors">
          {label}
        </Link>
        <button
          onClick={onToggle}
          className="cursor-pointer p-1 -mr-1"
          aria-label={`Toggle ${label.toLowerCase()} menu`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-100 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="absolute left-0 top-full h-2 w-full"></div>

      <div className={`absolute left-0 mt-2 w-60 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'}`}>
        <div className={scrollable ? 'py-2 max-h-[60vh] overflow-y-auto custom-scrollbar' : 'py-2'}>
          {items.map((item, index) => {
            const isActive = isItemActive(item.slug);
            return (
              <Link
                key={item.slug}
                to={`${basePath}/${item.slug}`}
                onClick={onClose}
                onMouseEnter={() => prefetchItem(item.slug)}
                className={`block px-4 py-2.5 text-sm border-l-2 transition-[color,background-color] duration-200 ${isActive
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-400 font-medium'
                  : 'text-gray-300 border-transparent hover:bg-gray-800/50 hover:text-white hover:border-gray-400'
                  }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DesktopDropdown;
