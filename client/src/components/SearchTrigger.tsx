import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useSearch } from '../hooks/useSearch'
import { SearchResults } from './SearchResults'

interface SearchTriggerProps {
  onExpand?: () => void
}

export function SearchTrigger({ onExpand }: SearchTriggerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const onExpandRef = useRef(onExpand)
  onExpandRef.current = onExpand
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useSearch(query)

  // Reset activeIndex when query changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  const collapse = () => {
    setIsExpanded(false)
    setQuery('')
    setActiveIndex(-1)
    triggerRef.current?.focus()
  }

  const expand = () => {
    setIsExpanded(true)
    onExpandRef.current?.()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Cmd+K / Ctrl+K — registered once via ref to avoid re-registering on every render
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsExpanded(true)
        onExpandRef.current?.()
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Click-outside collapses
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false)
        setQuery('')
        setActiveIndex(-1)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isExpanded])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const count = data?.results.length ?? 0
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, count - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && data?.results[activeIndex]) {
        navigate(data.results[activeIndex].navigation_url)
        collapse()
      }
    } else if (e.key === 'Escape') {
      collapse()
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
      <div className="w-9 h-9" aria-hidden="true" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-88 z-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-1.5 bg-secondary border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors"
          />
          <button
            onClick={() => (query ? setQuery('') : collapse())}
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
          isLoading={isLoading}
          isError={isError}
          error={error}
          onResultClick={collapse}
          activeIndex={activeIndex}
        />
      </div>
    </div>
  )
}
