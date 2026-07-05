import { Link } from 'react-router-dom'
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
    <div className="overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar pr-2 pb-3">
      <ul className="space-y-1">
        {links.map((linkGroup, index) => {
          const isCurrentLevel = currentLevel === linkGroup.title;

          return (
            <li key={index} className="group">
              {linkGroup.mainLink.startsWith('#') ? (
                <a
                  href={linkGroup.mainLink}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMainLinkClick(linkGroup.mainLink);
                  }}
                  className={`flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                    ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'text-gray-200 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                    }`}
                >
                  <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-cyan-400' : 'group-hover:translate-x-0.5'
                    }`} />
                  <span className="flex-1">{linkGroup.title}</span>
                </a>
              ) : (
                <Link
                  to={linkGroup.mainLink}
                  className={`flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                    ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'text-gray-200 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                    }`}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                >
                  <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-cyan-400' : 'group-hover:translate-x-0.5'
                    }`} />
                  <span className="flex-1">{linkGroup.title}</span>
                </Link>
              )}

              {linkGroup.subLinks && (
                <ul className="ml-4 space-y-1 overflow-hidden">
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
    <nav className="bg-secondary rounded-lg p-3 max-h-[calc(100vh-6rem)] overflow-hidden border border-gray-800 shadow-xl">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <List className="w-5 h-5 text-cyan-400" />
        </div>
        <h4 className="text-xl font-bold text-white">Contents</h4>
      </div>

      {linksContent}

      {/* <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div> */}
    </nav>
  );
}

export default TableOfContents;