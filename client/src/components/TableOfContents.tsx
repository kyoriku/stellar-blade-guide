import { useState } from 'react'
import { Link } from 'react-router-dom'
import { List, ChevronRight, ChevronDown } from 'lucide-react'

interface SubLink {
  href: string;
  title: string;
  id?: number;
}

interface TocLink {
  mainLink: string;
  title: string;
  subLinks?: SubLink[];
}

interface TableOfContentsProps {
  links: TocLink[];
  currentLevel?: string;
  showSubLinkCount?: boolean;
  activeSection?: string;
  collapsible?: boolean;
}

function TableOfContents({ links, currentLevel, showSubLinkCount = false, activeSection, collapsible = false }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offset = 86;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'instant'
      });
    }
  };

  const handleSubLinkClick = (href: string) => {
    scrollToSection(href);
    if (collapsible) setIsOpen(false);
  };

  const handleMainLinkClick = (href: string) => {
    scrollToSection(href);
    if (collapsible) setIsOpen(false);
  };

  // Count total locations/sections
  // const totalItems = links.reduce((sum, link) => sum + (link.subLinks?.length || 1), 0);

  const linksContent = (
    <div className={collapsible ? 'max-h-[60vh] overflow-y-auto custom-scrollbar pr-2' : 'overflow-y-auto max-h-[calc(100vh-10rem)] custom-scrollbar pr-2'}>
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
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border-l-2 border-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                    }`}
                >
                  <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-blue-400' : 'group-hover:translate-x-0.5'
                    }`} />
                  <span className="flex-1">{linkGroup.title}</span>
                  {showSubLinkCount && linkGroup.subLinks && (
                    <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-full">
                      {linkGroup.subLinks.length}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  to={linkGroup.mainLink}
                  className={`flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400 border-l-2 border-blue-400 shadow-lg shadow-blue-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                    }`}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    if (collapsible) setIsOpen(false);
                  }}
                >
                  <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-blue-400' : 'group-hover:translate-x-0.5'
                    }`} />
                  <span className="flex-1">{linkGroup.title}</span>
                  {showSubLinkCount && isCurrentLevel && linkGroup.subLinks && (
                    <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-full">
                      {linkGroup.subLinks.length}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub-links */}
              {linkGroup.subLinks && (
                <ul className="ml-4 space-y-1 overflow-hidden">
                  {linkGroup.subLinks.map((subLink, subIndex) => {
                    const isActiveSubLink = activeSection === subLink.href.substring(1);

                    return (
                      <li
                        key={subIndex}
                        style={{
                          animation: `slideIn 0.25s ease-out ${subIndex * 0.025}s both`
                        }}
                      >
                        <a
                          href={subLink.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleSubLinkClick(subLink.href);
                          }}
                          className={`group/sub flex items-center gap-2 text-sm px-3 py-1 rounded-lg transition-all duration-200 ${isActiveSubLink
                            ? 'text-blue-400 bg-blue-500/10 font-medium'
                            : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/30'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActiveSubLink ? 'bg-blue-400' : 'bg-gray-600 group-hover/sub:bg-blue-400'
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

  if (collapsible) {
    return (
      <nav className="bg-secondary rounded-lg border border-gray-800 shadow-xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full p-3 text-left"
        >
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <List className="w-5 h-5 text-blue-400" />
          </div>
          <h4 className="text-xl font-bold text-white flex-1">Contents</h4>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="px-3 pb-3 border-t border-gray-700">
            <div className="pt-3">
              {linksContent}
            </div>
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="sticky top-4 bg-secondary rounded-lg p-3 max-h-[calc(100vh-2rem)] overflow-hidden border border-gray-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <List className="w-5 h-5 text-blue-400" />
        </div>
        <h4 className="text-xl font-bold text-white">Contents</h4>
      </div>

      {linksContent}

      {/* Footer decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </nav>
  );
}

export default TableOfContents;