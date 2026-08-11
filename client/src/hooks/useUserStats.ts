import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { API_BASE_URL, ApiError, readError } from '../services/api'
import type { UserStatsResponse } from '../services/api'

/**
 * The signed-in user's collectible-completion aggregate
 * (GET /api/users/me/stats): overall + per-type + per-level + per-cycle
 * counts, plus comments_posted and member_since. All counts are
 * quantity-weighted (a checked ×N entry credits N — the site-wide unit);
 * the sparse quantity_overrides map lets clients weight live numerators.
 *
 * The Navbar mounts this with defaults (one small no-store fetch per
 * session); ProgressPage passes `refetchOnMount: 'always'` so a visit
 * reflects toggles made since the session-start snapshot.
 */
/**
 * Quantity-weighted found count: each checked entry credits its quantity.
 * The overrides map is sparse (quantity > 1 entries only, ~15 site-wide), so
 * the weighted count is the set size plus the extra (qty − 1) per checked
 * multi-quantity entry. O(overrides) per call.
 */
export function weightedFound(
  completedIds: Set<number>,
  overrides: Record<string, number>,
): number {
  let extra = 0
  for (const [id, qty] of Object.entries(overrides)) {
    if (completedIds.has(Number(id))) extra += qty - 1
  }
  return completedIds.size + extra
}

export function useUserStats(options?: { refetchOnMount?: 'always' }) {
  const { user, isAuthenticated, isLoading: authLoading, accessToken, authFetch } = useAuth()

  return useQuery({
    // Keyed by user id: logout never clears the query cache, so a second
    // account signing in on the same tab must not inherit a stale snapshot.
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/users/me/stats`)
      if (!res.ok) throw new ApiError(res.status, await readError(res, 'Failed to load your stats'))
      return (await res.json()) as UserStatsResponse
    },
    // Token presence, not just identity (the useProgress idiom): the cached
    // identity renders before the refresh lands, but the data layer must stay
    // quiet until a real token exists.
    enabled: isAuthenticated && !authLoading && accessToken !== null,
    ...options,
  })
}
