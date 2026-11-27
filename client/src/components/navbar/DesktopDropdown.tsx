import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { NavSection } from './navSections';
import { focusLeftNowhere } from '../../utils/focus';

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  // The latest onClose, for the popstate listener. Keyed on onClose, which Navbar makes anew each
  // render, it would be re-added as Back renders its page, before its turn, and miss that popstate.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  // Whether the open menu came from its arrow (a tap, a click or a key) rather than hover.
  const openedByArrow = useRef(false);

  // An open menu closes on a press anywhere outside it, whatever the pointer. A tap doesn't
  // focus the arrow in every browser (iOS Safari), so focus leaving can't close it there,
  // and a tap no longer counts as hover leaving.
  useEffect(() => {
    if (!isOpen) return;
    const onPress = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPress);
    return () => document.removeEventListener('pointerdown', onPress);
  }, [isOpen, onClose]);

  // Back, Forward and a typed fragment close an open menu, as they close the account menu, and
  // focus in it goes back to the arrow. One opened by hover closes too, with the pointer on it.
  useEffect(() => {
    if (!isOpen) return;
    const onPop = () => {
      const held = panelRef.current?.contains(document.activeElement) ?? false;
      onCloseRef.current();
      if (held) toggleRef.current?.focus();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isOpen]);

  // Escape closes an open menu with focus in it or nowhere: a tap, or Safari's click, on the arrow
  // focuses nothing. Focus in the menu, or nowhere when the arrow opened it, goes back to the
  // arrow; hover leaves focus alone. It goes by where the key was pressed, since the search's
  // Escape runs first and may give focus back inside this menu. A key pressed on nothing is the
  // search's or the bell's once their Escape has given focus back: one Escape closes one panel.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return;
      const from = e.target instanceof Node ? e.target : null;
      const nowhere = (!from || from === document.body) && focusLeftNowhere();
      if (!nowhere && !wrapperRef.current?.contains(from)) return;
      const back = nowhere ? openedByArrow.current : panelRef.current?.contains(from);
      onCloseRef.current();
      if (back) toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const isItemActive = (slug: string) =>
    itemActiveMatch === 'prefix'
      ? pathname.startsWith(`${basePath}/${slug}`)
      : pathname === `${basePath}/${slug}`;

  return (
    <div
      ref={wrapperRef}
      className="relative"
      // Hover opens and closes a menu for a mouse only. A tap fires an emulated hover too,
      // which opened the menu just before the tap's click on the arrow toggled it shut, so
      // touch screens couldn't open it; for a tap, the arrow is a plain toggle.
      onPointerEnter={e => {
        if (e.pointerType !== 'mouse') return;
        if (!isOpen) openedByArrow.current = false;
        onOpen();
      }}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse') onClose();
      }}
      onClick={onClose}
      // Focus leaving the menu closes it, so it doesn't stay open over the page. isOpen, since
      // another menu may have opened by hover meanwhile.
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
            openedByArrow.current = !isOpen;
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
