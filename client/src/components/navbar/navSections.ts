import type { LucideIcon } from 'lucide-react'
import { Book, Map, Package, Zap, Sparkles } from 'lucide-react'
import { WALKTHROUGHS, LEVELS, COLLECTIBLES, UPGRADES, COSMETICS } from '../../constants/navigation'
import { SECTION_LABELS, type SectionKey } from '../../constants/sections'

export type { SectionKey }

// Discriminated prefetch routing — maps 1:1 to the functions returned by usePrefetch().
export type PrefetchSpec =
  | { kind: 'walkthrough' }
  | { kind: 'level' }
  | { kind: 'type'; category: 'collectibles' | 'upgrades' | 'cosmetics' }

export interface NavSection {
  key: SectionKey
  label: string
  icon: LucideIcon
  basePath: string // absolute, no trailing slash, e.g. '/walkthroughs'
  items: readonly { slug: string; name: string }[]
  prefetch: PrefetchSpec
  itemActiveMatch: 'prefix' | 'exact' // walkthroughs = prefix (deeper detail routes), rest = exact
  scrollable: boolean // desktop Levels list only
  mobileMaxH: string // 'max-h-[1000px]': a tighter cap clips the last links once a list outgrows it
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { key: 'walkthroughs', label: SECTION_LABELS.walkthroughs, icon: Book, basePath: '/walkthroughs', items: WALKTHROUGHS, prefetch: { kind: 'walkthrough' }, itemActiveMatch: 'prefix', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'levels', label: SECTION_LABELS.levels, icon: Map, basePath: '/levels', items: LEVELS, prefetch: { kind: 'level' }, itemActiveMatch: 'exact', scrollable: true, mobileMaxH: 'max-h-[1000px]' },
  { key: 'collectibles', label: SECTION_LABELS.collectibles, icon: Package, basePath: '/collectibles', items: COLLECTIBLES, prefetch: { kind: 'type', category: 'collectibles' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'upgrades', label: SECTION_LABELS.upgrades, icon: Zap, basePath: '/upgrades', items: UPGRADES, prefetch: { kind: 'type', category: 'upgrades' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
  { key: 'cosmetics', label: SECTION_LABELS.cosmetics, icon: Sparkles, basePath: '/cosmetics', items: COSMETICS, prefetch: { kind: 'type', category: 'cosmetics' }, itemActiveMatch: 'exact', scrollable: false, mobileMaxH: 'max-h-[1000px]' },
] as const
