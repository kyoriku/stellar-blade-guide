import { useState, useEffect, useCallback } from 'react'
import { List, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SubLink {
  href: string
  title: string
  id?: number
}

interface TocLink {
  mainLink: string
  title: string
  subLinks?: SubLink[]
}

interface FloatingTOCProps {
  links: TocLink[]
  currentLevel?: string
  activeSection?: string
}

// iOS-safe scroll lock
function lockScroll() {
  const scrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'
}

function unlockScroll() {
  const scrollY = document.body.style.top
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, parseInt(scrollY || '0') * -1)
}

export default function FloatingTOC({ links, currentLevel, activeSection }: FloatingTOCProps) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    lockScroll()
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    unlockScroll()
    setIsOpen(false)
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  // Cleanup on unmount in case component unmounts while open
  useEffect(() => {
    return () => { if (isOpen) unlockScroll() }
  }, [isOpen])

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      const offset = 80
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top, behavior: 'instant' })
    }
  }

  const handleLinkClick = (href: string) => {
    close()
    requestAnimationFrame(() => scrollToSection(href))
  }

  return (
    <>
      {/* Floating button — only visible on mobile */}
      <button
        onClick={open}
        className="lg:hidden fixed bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-secondary border border-gray-700 hover:border-cyan-500/50 rounded-full shadow-lg shadow-black/40 text-sm font-medium text-gray-200 hover:text-white transition-all duration-200"
        aria-label="Open table of contents"
      >
        <List className="w-4 h-4 text-cyan-400" />
        Contents
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Bottom drawer */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-gray-700 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Drawer header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg">
            <List className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-base font-bold text-white flex-1">Contents</h4>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="overflow-y-auto custom-scrollbar px-3 py-3" style={{ maxHeight: 'calc(70vh - 56px)' }}>
          <ul className="space-y-1">
            {links.map((linkGroup, index) => {
              const isCurrentLevel = currentLevel === linkGroup.title

              return (
                <li key={index} className="group">
                  {linkGroup.mainLink.startsWith('#') ? (
                    <a
                      href={linkGroup.mainLink}
                      onClick={(e) => { e.preventDefault(); handleLinkClick(linkGroup.mainLink) }}
                      className={`flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                          ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                        }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-cyan-400' : ''}`} />
                      <span className="flex-1">{linkGroup.title}</span>
                    </a>
                  ) : (
                    <Link
                      to={linkGroup.mainLink}
                      onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); close() }}
                      className={`flex items-center gap-2 text-sm font-medium px-2 py-2 rounded-lg transition-all duration-200 ${isCurrentLevel
                          ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
                        }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-all duration-200 ${isCurrentLevel ? 'rotate-90 text-cyan-400' : ''}`} />
                      <span className="flex-1">{linkGroup.title}</span>
                    </Link>
                  )}

                  {linkGroup.subLinks && (
                    <ul className="ml-4 space-y-1 mt-1">
                      {linkGroup.subLinks.map((subLink, subIndex) => {
                        const isActive = activeSection === subLink.href.substring(1)
                        return (
                          <li key={subIndex}>
                            <a
                              href={subLink.href}
                              onClick={(e) => { e.preventDefault(); handleLinkClick(subLink.href) }}
                              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive
                                  ? 'text-cyan-400 bg-cyan-500/10 font-medium'
                                  : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-700/30'
                                }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-cyan-400' : 'bg-gray-600'
                                }`} />
                              <span className="flex-1">{subLink.title}</span>
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}