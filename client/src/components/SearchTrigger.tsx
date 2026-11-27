import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import { parsePath, useLocation, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useSearch } from '../hooks/useSearch'
import { focusLeftNowhere } from '../utils/focus'
import { isOpenAddress } from '../utils/openAddress'
import { SearchResults } from './SearchResults'

interface SearchTriggerProps {
  onExpand?: () => void
  /** The nav links the open input may overlay; its width snaps so it never cuts one mid-word. */
  avoidRef?: RefObject<HTMLElement | null>
}

// Queries are short, so the input is narrower than the results panel under it.
const INPUT_WIDTH = 256
// Below this the box is too small to type in, so it grows over a link instead of shrinking.
const MIN_INPUT_WIDTH = 176
const LINK_GAP = 4

// Some of it shows: inside the window and, unless it's in the fixed navbar, below it.
function onScreen(el: Element, bar: Element | null): boolean {
  const r = el.getBoundingClientRect()
  const top = bar && !bar.contains(el) ? bar.getBoundingClientRect().bottom : 0
  return r.bottom > top && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
}

// The button of the open panel holding el, if any: it names its panel through aria-controls.
function panelButtonOf(el: Element): HTMLElement | null {
  for (const button of document.querySelectorAll<HTMLElement>('[aria-expanded="true"][aria-controls]')) {
    if (document.getElementById(button.getAttribute('aria-controls') ?? '')?.contains(el)) return button
  }
  return null
}

export function SearchTrigger({ onExpand, avoidRef }: SearchTriggerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputWidth, setInputWidth] = useState(INPUT_WIDTH)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Set by close(true): once the search has closed, focus goes back to what opened it.
  const returnFocus = useRef(false)
  // Set when a pointer press closed it: focus goes back without the focus ring, as after a click.
  const quietReturn = useRef(false)
  // What had focus when Ctrl+K opened the search, if anything did: what opened it then.
  const opener = useRef<HTMLElement | null>(null)
  // The button of the open panel the opener sat in, which opening the search may close.
  const openerPanel = useRef<HTMLElement | null>(null)
  // Whether opening the search closed that panel: hover can open a nav menu again before Escape.
  const openerPanelClosed = useRef(false)
  // The latest onExpand, for the Ctrl+K listener registered once below. Updated after each
  // commit rather than during render, so a render React sets aside never reaches it.
  const onExpandRef = useRef(onExpand)
  useEffect(() => { onExpandRef.current = onExpand })
  const navigate = useNavigate()
  const location = useLocation()
  // isPending, as on mobile: TanStack's isLoading is false while the query is still
  // debouncing (disabled), which flashed "No results" on the second character.
  const { data, isPending, isError, error } = useSearch(query)

  // The input opens leftward over the navbar. Where its edge lands against the links
  // depends on the system font's label widths, so it is measured: if the default width
  // would cut a link, shrink to stop short of it, or grow to cover it whole when
  // shrinking would leave too little room to type.
  useLayoutEffect(() => {
    if (!isExpanded) return
    const measure = () => {
      const box = containerRef.current
      const links = avoidRef?.current
      let width = INPUT_WIDTH
      if (box && links) {
        const right = box.getBoundingClientRect().right
        const edge = right - INPUT_WIDTH
        const cut = [...links.children]
          .map(c => c.getBoundingClientRect())
          .find(r => r.left < edge && edge < r.right)
        if (cut) {
          const shrunk = right - (cut.right + LINK_GAP)
          width = Math.round(shrunk >= MIN_INPUT_WIDTH ? shrunk : right - (cut.left - LINK_GAP))
        }
      }
      setInputWidth(width)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isExpanded, avoidRef])

  // Reset activeIndex when query changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  // Every way the search closes. One that takes the reader nowhere gives focus back.
  const close = useCallback((giveFocusBack: boolean, byPointer = false) => {
    returnFocus.current = giveFocusBack
    quietReturn.current = byPointer
    setIsExpanded(false)
    setQuery('')
    setActiveIndex(-1)
  }, [])

  // The Search button only mounts once the search has closed, and by now React has put back
  // what focus it could, so this sticks. Focus someone moved on meanwhile stays where it is.
  useLayoutEffect(() => {
    if (isExpanded) {
      openerPanelClosed.current = openerPanel.current?.getAttribute('aria-expanded') === 'false'
      return
    }
    const giveBack = returnFocus.current
    const quiet = quietReturn.current
    const from = opener.current
    const panelButton = openerPanel.current
    const panelClosed = openerPanelClosed.current
    returnFocus.current = false
    quietReturn.current = false
    opener.current = null
    openerPanel.current = null
    openerPanelClosed.current = false
    if (!giveBack || !focusLeftNowhere()) return
    const bar = triggerRef.current?.closest('nav') ?? null
    // An opener in a panel that has closed since Ctrl+K gives way to the panel's button, if that's
    // on screen: the panel fades out. Opening the search closes the nav menus, the account menu and
    // the bell's, and hover may open a nav menu again meanwhile.
    const closedPanel = panelButton?.isConnected && (panelClosed || panelButton.getAttribute('aria-expanded') === 'false') && onScreen(panelButton, bar)
    const target = closedPanel ? panelButton : from?.isConnected && onScreen(from, bar) ? from : triggerRef.current
    const options: FocusOptions = quiet ? { preventScroll: true, focusVisible: false } : { preventScroll: true }
    target?.focus(options)
    // One that can't take focus (hidden, inert, disabled) leaves it to the Search button.
    if (document.activeElement !== target) triggerRef.current?.focus(options)
  }, [isExpanded])

  const expand = () => {
    opener.current = null
    openerPanel.current = null
    setIsExpanded(true)
    onExpandRef.current?.()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Cmd+K / Ctrl+K — registered once via ref to avoid re-registering on every render
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // A closed search opened from somewhere on the page gives focus back there when it closes.
        if (triggerRef.current) {
          const from = document.activeElement
          opener.current = from instanceof HTMLElement && from !== document.body ? from : null
          openerPanel.current = opener.current && panelButtonOf(opener.current)
        }
        setIsExpanded(true)
        onExpandRef.current?.()
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Escape closes it from anywhere: the box, the X, a result, or the page after a press on the
  // panel. Focus moved elsewhere meanwhile stays there.
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing) return
      close(focusLeftNowhere(containerRef.current))
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded, close])

  // Back, Forward and a typed fragment close it, and focus in it goes back to the Search button: a
  // Ctrl+K opener belongs to the entry left behind, where React may have reused its node.
  useEffect(() => {
    if (!isExpanded) return
    const onPop = () => {
      opener.current = null
      openerPanel.current = null
      close(!!containerRef.current?.contains(document.activeElement))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isExpanded, close])

  // Focus landing on something outside closes it, and stays where it went: from the box, or from
  // the page after a press on the panel, where Tab blurs nothing in it. Focus going nowhere (that
  // press, the window losing focus) fires no focusin, so it stays open.
  useEffect(() => {
    if (!isExpanded) return
    const onFocusIn = (e: FocusEvent) => {
      // No box: the search has closed, and its own focus return is running.
      const box = containerRef.current
      if (box && e.target instanceof Node && !box.contains(e.target)) close(false)
    }
    document.addEventListener('focusin', onFocusIn, true)
    return () => document.removeEventListener('focusin', onFocusIn, true)
  }, [isExpanded, close])

  // A press outside closes it, and focus goes where the press puts it.
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isExpanded, close])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Rows the panel is hiding behind its skeleton can't be selected or opened.
    const results = isPending ? [] : (data?.results ?? [])
    const count = results.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, count - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        // Its keypress would press the Search button once that takes focus, and reopen the search.
        e.preventDefault()
        // The address already open replaces its entry, so Back still leaves the page.
        const url = results[activeIndex].navigation_url
        const open = isOpenAddress(url, location)
        void navigate(url, { replace: open })
        // The page you're on, with no card or section to land on: nothing moves, so focus
        // goes back.
        close(open && !parsePath(url).hash)
      }
    }
  }

  if (!isExpanded) {
    return (
      <button
        ref={triggerRef}
        onClick={expand}
        aria-label="Search (Ctrl+K)"
        className="hidden lg:flex p-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-lg transition-all duration-200 cursor-pointer"
      >
        <Search className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div ref={containerRef} className="hidden lg:block relative">
      <div className="w-9 h-10" aria-hidden="true" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50" style={{ width: inputWidth }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search…"
            className="w-full pl-9 pr-8 py-1.5 bg-secondary border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors"
          />
          <button
            // A press keeps focus in the box, in every engine.
            onMouseDown={e => e.preventDefault()}
            onClick={e => {
              if (query) {
                setQuery('')
                inputRef.current?.focus()
              } else {
                // A click from Enter or Space has no detail, so it keeps the focus ring.
                close(true, e.detail > 0)
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            aria-label={query ? 'Clear search' : 'Close search'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="animate-drop-in absolute right-0 mt-2 w-88 bg-nav backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
        <SearchResults
          query={query}
          data={data}
          isLoading={isPending}
          isError={isError}
          error={error}
          onResultClick={close}
          activeIndex={activeIndex}
        />
      </div>
    </div>
  )
}
