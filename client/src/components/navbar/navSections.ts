import type { LucideIcon } from 'lucide-react'
import { Book, Map, Package, Zap, Sparkles, Box } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from '../../constants/navigation'

export type SectionKey = 'walkthroughs' | 'levels' | 'collectibles' | 'upgrades' | 'cosmetics' | 'materials'

// Discriminated prefetch routing — maps 1:1 to the functions returned by usePrefetch().
export type PrefetchSpec =
  | { kind: 'walkthrough' }
  | { kind: 'level' }
  | { kind: 'type'; category: 'collectibles' | 'upgrades' | 'cosmetics' | 'materials' }

export interface NavSection {
  key: SectionKey
  label: string
  icon: LucideIcon
  basePath: string // absolute, no trailing slash, e.g. '/walkthroughs'
  items: readonly { slug: string; name: string }[]
  prefetch: PrefetchSpec
  itemActiveMatch: 'prefix' | 'exact' // walkthroughs = prefix (deeper detail routes), rest = exact
  scrollable: boolean // desktop Levels list only
  mobileMaxH: string // 'max-h-96' (walkthroughs) | 'max-h-[1000px]'
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { key: 'walkthroughs', label: 'Walkthroughs', icon: Book, basePath: '/walkthroughs', items: WALKTHROUGHS, prefetch: { kind: 'walkthrough' }, itemActiveMatch: 'prefix', scrollable: false, mobileMaxH: 'max-h-96' },
  { key: 'levels', label: 'Levels', icon: Map, basePath: '/levels', items: LEVELS, prefetch: { kind: 'level' }, itemActiveMatch: 'exact', scrollable: true, mobileMaxH: 'max-h-[1000px]' },
  { key: 'collectibles', label: 'Collectibles', icon: Package, basePath: '/collectibles', items: COLLECTIBLES, prefetch: { kind: 'type', category: 'collectibles' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'upgrades', label: 'Upgrades', icon: Zap, basePath: '/upgrades', items: UPGRADES, prefetch: { kind: 'type', category: 'upgrades' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'cosmetics', label: 'Cosmetics', icon: Sparkles, basePath: '/cosmetics', items: COSMETICS, prefetch: { kind: 'type', category: 'cosmetics' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'materials', label: 'Materials', icon: Box, basePath: '/materials', items: MATERIALS, prefetch: { kind: 'type', category: 'materials' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
] as const
