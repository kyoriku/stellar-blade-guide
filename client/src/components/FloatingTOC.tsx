import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { List, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { scrollToSection, type TocLink } from '../utils/toc'

interface FloatingTOCProps {
  links: TocLink[]
  currentLevel?: string
  activeSection?: string
  onNavigate?: (href: string) => void
}

// Scrolling is held by touch-action on the backdrop and the drawer shell (which
// together cover the viewport), not by pinning the body. Pinning put
// position:fixed on the element holding every article and image, which on iOS
// promotes a composited layer as tall as the document — created and destroyed
// on every open and close, in the same frame as a jump. That killed the tab on
// long pages. Nothing here writes scroll position, so opening the drawer cannot
// move the page and there is nothing to restore.
export default function FloatingTOC({ links, currentLevel, activeSection, onNavigate }: FloatingTOCProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Set on a link tap and consumed once the drawer has closed, so the jump runs
  // in that commit rather than in a frame that can interleave with it.
  const pendingJump = useRef<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [listScrolls, setListScrolls] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])

  const close = useCallback(() => setIsOpen(false), [])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  // Runs only once the drawer is closed, so nothing can throw the jump back.
  // useLayoutEffect rather than useEffect so the scroll lands before the
  // browser paints — no frame shows the old offset with the drawer already gone.
  useLayoutEffect(() => {
    if (isOpen) return
    const href = pendingJump.current
    if (!href) return
    pendingJump.current = null
    scrollToSection(href)
  }, [isOpen])

  // pan-y is only safe while the list has somewhere to scroll. overscroll-behavior
  // contain only blocks chaining at a real scroll boundary, so on a list that fits
  // there is no boundary and pan-y hands the drag straight to the page behind.
  // Measured from the element rather than counted from links, because sorting,
  // filtering and the scroll-spy all change the list's height. Measuring here runs
  // before paint, so the first frame is already correct; the observer keeps it true
  // if the content or the 70vh box changes while the drawer is open.
  useLayoutEffect(() => {
    if (!isOpen) return
    const scroller = scrollerRef.current
    const list = listRef.current
    if (!scroller || !list) return

    const measure = () => setListScrolls(scroller.scrollHeight > scroller.clientHeight)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    observer.observe(list)
    return () => observer.disconnect()
  }, [isOpen])

  const handleLinkClick = (href: string) => {
    onNavigate?.(href)
    pendingJump.current = href
    setIsOpen(false)
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
          // Holds the page still without pinning the body. touch-action only
          // suppresses browser-handled gestures, so the tap-to-close below
          // still fires.
          style={{ touchAction: 'none' }}
          onClick={close}
        />
      )}

      {/* Bottom drawer */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-gray-700 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        // The shell and the backdrop together cover the viewport, so this is
        // the other half of holding the page still — a drag on the header must
        // not scroll what is behind it.
        style={{ maxHeight: '70vh', touchAction: 'none' }}
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
        <div
          ref={scrollerRef}
          className="overflow-y-auto custom-scrollbar px-3 py-3"
          // pan-y opts this list back in, since touch-action on the shell above
          // governs descendants — but only once it has somewhere to scroll, or
          // the drag chains to the page. overscroll-behavior stops it chaining
          // at either end when it does scroll.
          style={{
            maxHeight: 'calc(70vh - 56px)',
            overscrollBehavior: 'contain',
            touchAction: listScrolls ? 'pan-y' : 'none',
          }}
        >
          <ul ref={listRef} className="space-y-1">
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
                          : 'text-gray-200 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
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
                          : 'text-gray-200 hover:text-white hover:bg-gray-700/50 border-l-2 border-transparent hover:border-gray-600'
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
                                  : 'text-gray-300 hover:text-cyan-400 hover:bg-gray-700/30'
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