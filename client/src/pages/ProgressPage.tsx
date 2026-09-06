import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
// Map is aliased: the bare icon name would shadow the global Map constructor
// used by the row-builder helpers.
import { Box, CircleEllipsis, Compass, Map as MapIcon, Repeat, Sparkles, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SEO from '../components/SEO'
import seo from '../constants/seo.json'
import QueryError from '../components/QueryError'
import CompletionRing from '../components/CompletionRing'
import { useUserStats, weightedFound } from '../hooks/useUserStats'
import { useProgress } from '../hooks/useProgress'
import { usePrefetch } from '../hooks/usePrefetch'
import { COLLECTIBLES, UPGRADES, COSMETICS, MATERIALS } from '../constants/navigation'
import { pct, typeRows, levelRows, nonLevelRows, cycleRows } from '../utils/progressRows'
import type { Stat } from '../utils/progressRows'

// The page chrome is fully static: headings, cards, row labels, and links
// render immediately from the nav constants, and only the value slots
// (counts, bars, ring, member line) wait for data. There is no separate
// skeleton tree — data arrival fills the same rows in place, so nothing
// moves or reorders on load. Row membership/order/label logic lives in
// utils/progressRows.ts (pure, unit-tested); this file owns rendering.

// Same category → icon mapping as TypeBadge.tsx; `nav` is the navbar's type
// list for the category — it drives row membership, order, and labels.
const CATEGORY_META = [
  { key: 'collectibles', label: 'Collectibles', Icon: Compass, nav: COLLECTIBLES },
  { key: 'upgrades', label: 'Upgrades', Icon: Zap, nav: UPGRADES },
  { key: 'cosmetics', label: 'Cosmetics', Icon: Sparkles, nav: COSMETICS },
  { key: 'materials', label: 'Materials', Icon: Box, nav: MATERIALS },
] as const

const dualTypeFootnote = (
  <p className="text-xs text-gray-400">
    Dual-purpose items are counted in each of their types, so type totals can sum
    above the overall total.
  </p>
)

function StatRow({
  name,
  to,
  stat,
  onMouseEnter,
}: {
  name: string
  to: string | null
  stat: Stat | null
  onMouseEnter?: () => void
}) {
  const p = stat ? pct(stat.completed, stat.total) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        {to ? (
          <Link
            to={to}
            onMouseEnter={onMouseEnter}
            className="text-sm text-gray-300 hover:text-cyan-400 transition-colors truncate"
          >
            {name}
          </Link>
        ) : (
          <span className="text-sm text-gray-300 truncate">{name}</span>
        )}
        {stat ? (
          <span className="text-xs text-gray-400 tabular-nums shrink-0">
            {stat.completed}/{stat.total}<span className="text-cyan-400"> · </span>{p}%
          </span>
        ) : (
          // Pulsing slot sized to the text-xs line box it replaces.
          <span aria-hidden className="h-4 w-16 self-center bg-gray-700/50 rounded animate-pulse shrink-0" />
        )}
      </div>
      {/* Decorative — the line above carries the numbers */}
      <div className={`h-1.5 rounded-full bg-gray-700 overflow-hidden${stat ? '' : ' animate-pulse'}`} aria-hidden>
        {stat && <div className="h-full rounded-full bg-cyan-400" style={{ width: `${p}%` }} />}
      </div>
    </div>
  )
}

// Card-header rollup: counts + percent (StatRow's value styling) paired with
// the 16px ring, mirroring the account dropdown's "42% ◔" motif. Loading →
// pulsing chip; loaded with no matching stat → nothing.
function HeaderStat({ stat, loading }: { stat?: Stat; loading: boolean }) {
  if (loading) {
    return <span aria-hidden className="h-4 w-16 bg-gray-700/50 rounded animate-pulse" />
  }
  if (!stat) return null
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 tabular-nums">
        {stat.completed}/{stat.total}<span className="text-cyan-400"> · </span>
        {pct(stat.completed, stat.total)}%
      </span>
      <CompletionRing
        fraction={stat.total > 0 ? stat.completed / stat.total : 0}
        size={16}
        strokeWidth={2.5}
      />
    </span>
  )
}

function SectionCard({
  Icon,
  title,
  headerEnd,
  children,
}: {
  Icon: LucideIcon
  title: string
  headerEnd?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-secondary border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        {headerEnd != null && <span className="ml-auto">{headerEnd}</span>}
      </div>
      {children}
    </section>
  )
}

// Column-major two-column rows on md+ (single column below): explicit row
// count from the data keeps auto-placement to exactly two columns, and
// filling down-then-over preserves the list's order for vertical scanning.
function TwoColRows({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 md:grid-flow-col md:gap-x-6"
      style={{ gridTemplateRows: `repeat(${Math.max(1, Math.ceil(count / 2))}, auto)` }}
    >
      {children}
    </div>
  )
}

export default function ProgressPage() {
  const { data: stats, isError, error, refetch } = useUserStats({ refetchOnMount: 'always' })
  const { completedIds, isLoading: progressLoading } = useProgress()
  const { prefetchLevel, prefetchCollectiblesByType } = usePrefetch()

  // Live numerator: completedIds is optimistically updated on every toggle,
  // so the hero matches the navbar ring instantly. Counts are quantity-
  // weighted (a checked ×N entry credits N — the site-wide unit); the sparse
  // overrides map rides the stats payload the hero already waits for.
  const liveCompleted = stats ? weightedFound(completedIds, stats.quantity_overrides) : 0

  const lvls = levelRows(stats?.levels)
  const nonLvls = nonLevelRows(stats?.levels)
  const cycs = cycleRows(stats?.cycles)

  return (
    <div className="min-h-main bg-primary py-12 px-4">
      {/* Tab title mirrors the menu label; the h1 carries the fuller name —
          same split as Settings ("Settings" / "Account Settings"). */}
      <SEO title={seo.noindex['/progress'].title} description={seo.noindex['/progress'].description} noindex />
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-100">My Progress</h1>

        {isError ? (
          <QueryError error={error} onRetry={() => void refetch()} />
        ) : (
          <>
            <section className="bg-secondary border border-gray-800 rounded-xl p-6">
              {/* The hero needs both the stats snapshot (denominator) and the
                  live progress set (numerator), so it waits for both — no
                  fabricated numbers. Bucket rows below only need stats. */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {stats && !progressLoading ? (
                  <>
                    <div className="relative shrink-0">
                      <CompletionRing
                        fraction={stats.total.total > 0 ? liveCompleted / stats.total.total : 0}
                        size={120}
                        strokeWidth={10}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-cyan-400 tabular-nums">
                        {pct(liveCompleted, stats.total.total)}%
                      </span>
                    </div>
                    <div className="min-w-0 text-center sm:text-left">
                      <p className="text-2xl md:text-3xl font-bold text-gray-100">
                        {`${liveCompleted.toLocaleString()} of ${stats.total.total.toLocaleString()} collectibles found`}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Member since{' '}
                        {new Date(stats.member_since).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                        })}
                        <span className="text-cyan-400">{' · '}</span>
                        {stats.comments_posted} comment{stats.comments_posted === 1 ? '' : 's'} posted
                      </p>
                      {liveCompleted === 0 && (
                        <p className="text-sm text-gray-400 mt-2">
                          Mark collectibles as found on any level or category page to start tracking.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  // Placeholder bars sized to the real line boxes (text-2xl →
                  // h-8, md:text-3xl → h-9, text-sm meta → h-5 with mt-2).
                  <>
                    <div className="w-30 h-30 rounded-full bg-gray-700 animate-pulse shrink-0" />
                    <div className="min-w-0 w-full sm:flex-1">
                      <div className="h-8 md:h-9 w-72 max-w-full bg-gray-700 rounded animate-pulse mx-auto sm:mx-0" />
                      <div className="mt-2 h-5 w-64 max-w-full bg-gray-700/50 rounded animate-pulse mx-auto sm:mx-0" />
                    </div>
                  </>
                )}
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              {CATEGORY_META.map(({ key, label, Icon, nav }) => (
                <SectionCard
                  key={key}
                  Icon={Icon}
                  title={label}
                  headerEnd={
                    <HeaderStat
                      loading={!stats}
                      stat={stats?.categories.find(c => c.category === key)}
                    />
                  }
                >
                  <div className="space-y-4">
                    {typeRows(stats?.types, key, nav).map(r => {
                      const slug = r.slug
                      return (
                        <StatRow
                          key={r.key}
                          name={r.label}
                          to={slug ? `/${key}/${slug}` : null}
                          stat={r.stat}
                          onMouseEnter={slug ? () => void prefetchCollectiblesByType(slug, key) : undefined}
                        />
                      )
                    })}
                  </div>
                </SectionCard>
              ))}
            </div>
            {dualTypeFootnote}

            <SectionCard Icon={MapIcon} title="By Level">
              <TwoColRows count={lvls.length}>
                {lvls.map(r => {
                  const slug = r.slug
                  return (
                    <StatRow
                      key={r.key}
                      name={r.label}
                      to={slug ? `/levels/${slug}` : null}
                      stat={r.stat}
                      onMouseEnter={slug ? () => void prefetchLevel(slug) : undefined}
                    />
                  )
                })}
              </TwoColRows>
            </SectionCard>

            <SectionCard Icon={CircleEllipsis} title="Other Sources">
              <TwoColRows count={nonLvls.length}>
                {nonLvls.map(r => (
                  <StatRow key={r.key} name={r.label} to={null} stat={r.stat} />
                ))}
              </TwoColRows>
            </SectionCard>

            <SectionCard Icon={Repeat} title="By Cycle">
              <TwoColRows count={cycs.length}>
                {cycs.map(r => (
                  <StatRow key={r.key} name={r.label} to={null} stat={r.stat} />
                ))}
              </TwoColRows>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  )
}
