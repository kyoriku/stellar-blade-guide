import { useId, useRef } from 'react';
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
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      // From the keyboard: Escape closes an open menu, giving focus back to its arrow when
      // it was in the menu, and focus leaving the menu closes it, so it doesn't stay open
      // over the page. isOpen, since another menu may have opened by hover meanwhile.
      onKeyDown={e => {
        if (e.key !== 'Escape' || !isOpen) return;
        onClose();
        if (panelRef.current?.contains(document.activeElement)) toggleRef.current?.focus();
      }}
      onBlur={e => {
        if (isOpen && !e.currentTarget.contains(e.relatedTarget)) onClose();
      }}
    >
      <div className={`flex items-center gap-1 px-4 py-2 rounded-lg hover:text-cyan-400 hover:bg-gray-800/50 ${isActiveCategory ? 'text-cyan-400' : 'text-gray-300'
        }`}>
        <Link to={basePath} className="hover:text-cyan-400 transition-colors">
          {label}
        </Link>
        <button
          ref={toggleRef}
          // Its own press only: the wrapper's click closes the menu, which undid this one,
          // so Enter and Space left it shut.
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
          className="cursor-pointer p-1 -mr-1"
          aria-label={`Toggle ${label.toLowerCase()} menu`}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-100 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="absolute left-0 top-full h-2 w-full"></div>

      {/* Opening leaves visibility out of the transition, so the items can take focus in the
          frame the menu opens (a Tab straight after Enter); closing keeps it in, so the menu
          stays visible while it fades. */}
      <div ref={panelRef} id={panelId} className={`absolute left-0 mt-2 w-60 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden duration-200 ${isOpen ? 'transition-[opacity,translate] opacity-100 visible translate-y-0 pointer-events-auto' : 'transition-all opacity-0 invisible translate-y-2 pointer-events-none'}`}>
        <div className={scrollable ? 'py-2 max-h-[60vh] overflow-y-auto custom-scrollbar' : 'py-2'}>
          {items.map((item, index) => {
            const isActive = isItemActive(item.slug);
            return (
              <Link
                key={item.slug}
                to={`${basePath}/${item.slug}`}
                onClick={onClose}
                onMouseEnter={() => prefetchItem(item.slug)}
                // Keyboard focus lights an item as hover does, and rings the current page's
                // item inside its bar: the panel's overflow-hidden clips an outline drawn
                // outside a full-width link. The account menu's items do the same.
                className={`block px-4 py-2.5 text-sm border-l-2 transition-[color,background-color] duration-200 ${isActive
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-400 font-medium focus-visible:text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white'
                  : 'text-gray-300 border-transparent hover:bg-gray-800/50 hover:text-white hover:border-gray-400 focus-visible:outline-hidden forced-colors:focus-visible:-outline-offset-4 focus-visible:text-white focus-visible:bg-gray-800/50 focus-visible:border-gray-400'
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
