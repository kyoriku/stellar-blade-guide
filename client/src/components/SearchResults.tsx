import { Link } from 'react-router-dom'
import { Compass, Zap, Sparkles, Box, BookOpen, Map } from 'lucide-react'
import type { SearchResponse } from '../services/api'
import { errorMessage } from '../services/api'
import { usePrefetch } from '../hooks/usePrefetch'

interface SearchResultsProps {
  query: string
  data?: SearchResponse
  isLoading: boolean
  isError: boolean
  error?: unknown
  onResultClick: () => void
  activeIndex?: number
}

const KIND_ICONS = {
  collectibles: Compass,
  upgrades:     Zap,
  cosmetics:    Sparkles,
  materials:    Box,
  walkthrough:  BookOpen,
  level:        Map,
} as const

function parsePrefetchTarget(result: { kind: string; navigation_url: string }) {
  try {
    const [urlPart, anchor] = result.navigation_url.split('#')
    const parts = urlPart.split('/').filter(Boolean)
    const isCollectibleKind = ['collectibles', 'upgrades', 'cosmetics', 'materials'].includes(result.kind)
    if (isCollectibleKind && parts.length >= 2)
      return { kind: 'collectible' as const, category: parts[0], typeSlug: parts[1], anchor }
    if (result.kind === 'walkthrough' && parts.length >= 3)
      return { kind: 'walkthrough' as const, type: parts[1], slug: parts[2] }
    if (result.kind === 'level' && parts.length >= 2)
      return { kind: 'level' as const, levelSlug: parts[1] }
  } catch {
    // malformed url — don't prefetch
  }
  return null
}

export function SearchResults({
  query,
  data,
  isLoading,
  isError,
  error,
  onResultClick,
  activeIndex = -1,
}: SearchResultsProps) {
  const { prefetchCollectiblesByType, prefetchWalkthroughBySlug, prefetchLevel } = usePrefetch()

  const handleMouseEnter = (result: SearchResponse['results'][number]) => {
    const target = parsePrefetchTarget(result)
    if (!target) return
    if (target.kind === 'collectible')
      void prefetchCollectiblesByType(target.typeSlug, target.category, target.anchor)
    else if (target.kind === 'walkthrough')
      void prefetchWalkthroughBySlug(target.type, target.slug)
    else if (target.kind === 'level')
      void prefetchLevel(target.levelSlug)
  }

  if (query.length < 2) {
    return (
      <div className="px-4 py-6 text-sm text-gray-400 text-center">
        Search collectibles, walkthroughs, levels...
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="h-7 w-7 bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-4 py-6 text-sm text-gray-400 text-center">
        {errorMessage(error, 'Search is unavailable. Try again later.')}
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="px-4 py-6 text-sm text-gray-400 text-center">
        No results for &ldquo;{query}&rdquo;
      </div>
    )
  }

  return (
    <div className="py-1">
      {data.results.map((result, i) => {
        const Icon = KIND_ICONS[result.kind]
        const isActive = i === activeIndex
        return (
          <Link
            key={`${result.kind}-${result.id}`}
            to={result.navigation_url}
            onClick={onResultClick}
            onMouseEnter={() => handleMouseEnter(result)}
            className={`group flex items-start gap-3 px-4 py-3 transition-colors rounded-lg mx-1 ${
              isActive ? 'bg-gray-800/70' : 'hover:bg-gray-800/50'
            }`}
          >
            {Icon && (
              <span className="p-1.5 rounded-full shrink-0 mt-0.5 bg-cyan-500/20 text-cyan-400">
                <Icon className="w-4 h-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-100 truncate">{result.title}</p>
              {result.snippet && (
                <p className="text-xs text-gray-300 truncate mt-0.5">{result.snippet}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}