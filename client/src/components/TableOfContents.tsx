import { List, ChevronRight } from 'lucide-react'
import { scrollToSection, type TocLink } from '../utils/toc'

interface TableOfContentsProps {
  links: TocLink[];
  currentLevel?: string;
  activeSection?: string;
  onNavigate?: (href: string) => void;
}

function TableOfContents({ links, currentLevel, activeSection, onNavigate }: TableOfContentsProps) {
  const handleSubLinkClick = (href: string) => {
    onNavigate?.(href);
    scrollToSection(href);
  };

  const handleMainLinkClick = (href: string) => {
    onNavigate?.(href);
    scrollToSection(href);
  };

  const linksContent = (
    <div
      // Must stay exactly 96px below the nav's cap (13rem vs 7rem): that is this
      // panel's chrome above and below the scroller (measured 95px, 1px slack),
      // and it is what keeps THIS the binding cap, so the nav's overflow-hidden
      // never truncates instead of letting the list scroll.
      // The extra 1rem over the old 12rem, plus --nav-height, is the 81px the
      // page wrapper's sticky offset gained when it moved below the navbar.
      className="overflow-y-auto max-h-[calc(100vh-13rem-var(--nav-height))] custom-scrollbar pr-2 pb-3"
    >
      <ul className="space-y-1">
        {links.map((linkGroup, index) => {
          const isCurrentLevel = currentLevel === linkGroup.title;

          return (
            <li key={index} className="group">
              <a
                href={linkGroup.mainLink}
                onClick={(e) => {
                  e.preventDefault();
                  handleMainLinkClick(linkGroup.mainLink);
                }}
                className={`flex items-center gap-2 text-sm font-medium py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                  ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'text-gray-200 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                  }`}
              >
                <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-cyan-400' : 'group-hover:translate-x-0.5'
                  }`} />
                <span className="flex-1">{linkGroup.title}</span>
              </a>

              {linkGroup.subLinks && (
                <ul className="ml-2 space-y-1 overflow-hidden">
                  {linkGroup.subLinks.map((subLink, subIndex) => {
                    const isActiveSubLink = activeSection === subLink.href.substring(1);

                    return (
                      <li
                        key={subIndex}
                        style={{
                          animation: `slideIn 0.25s ease-out ${subIndex * 0.005}s both`
                        }}
                      >
                        <a
                          href={subLink.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubLinkClick(subLink.href);
                          }}
                          className={`group/sub flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-all duration-200 ${isActiveSubLink
                            ? 'text-cyan-400 bg-cyan-500/10 font-medium'
                            : 'text-gray-300 hover:text-cyan-400 hover:bg-gray-700/30'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActiveSubLink ? 'bg-cyan-400' : 'bg-gray-600 group-hover/sub:bg-cyan-400'
                            }`}></div>
                          <span className="flex-1">{subLink.title}</span>
                          <ChevronRight className={`w-3 h-3 transition-all duration-200 ${isActiveSubLink
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:translate-x-0'
                            }`} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <nav
      // The page wrapper pins this below the navbar at nav + 2rem, so the budget
      // gives back the same 81px: 1rem of the 7rem, plus --nav-height. The
      // remaining 6rem covers the Back to top button and the wrapper's pb-4
      // beneath the panel.
      className="bg-secondary rounded-lg p-3 max-h-[calc(100vh-7rem-var(--nav-height))] overflow-hidden border border-gray-800 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <List className="w-5 h-5 text-cyan-400" />
        </div>
        <h4 className="text-xl font-bold text-white">Contents</h4>
      </div>

      {linksContent}
    </nav>
  );
}

export default TableOfContents;