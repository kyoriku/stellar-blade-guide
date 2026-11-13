import { CHALLENGE_MESSAGE, NETWORK_ERROR_MESSAGE, RATE_LIMIT_MESSAGE, SERVER_ERROR_MESSAGE } from '../constants/errorCopy';

export { NETWORK_ERROR_MESSAGE };

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;
  // False unless the body was the API's own error JSON.
  fromServer: boolean;
  // A Cloudflare challenge, which only a page load passes.
  challenged: boolean;

  constructor(status: number, message: string, { fromServer = false, challenged = false } = {}) {
    super(message);
    this.status = status;
    this.fromServer = fromServer;
    this.challenged = challenged;
    this.name = 'ApiError';
  }
}

/**
 * Normalize a backend error body to a single display string. This API uses two
 * envelopes: FastAPI's { detail: "msg" } / { detail: [{ msg }] } (validation),
 * and a custom { error, message } (global 500 + slowapi 429 + bot/origin 404s).
 * Pydantic prefixes custom ValueError messages with "Value error, " — stripped.
 * Falls back when nothing usable is present.
 */
function getApiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as { detail?: unknown; message?: unknown; error?: unknown };
    if (Array.isArray(b.detail)) {
      const messages = b.detail
        .map((item) =>
          item && typeof item === 'object' && 'msg' in item
            ? String((item as { msg: unknown }).msg).replace('Value error, ', '')
            : ''
        )
        .filter(Boolean);
      if (messages.length > 0) return messages.join(', ');
    }
    if (typeof b.detail === 'string' && b.detail) return b.detail;
    if (typeof b.message === 'string' && b.message) return b.message;
    if (typeof b.error === 'string' && b.error) return b.error;
  }
  return fallback;
}

/**
 * Best display string for any caught client error: a server-provided ApiError
 * message, an offline notice for network (fetch) failures, a plain Error
 * message, or the fallback. Use in catch blocks that show errors to users.
 * `challenge` replaces a challenge's sentence where a reload would lose typed text.
 */
export function errorMessage(err: unknown, fallback: string, challenge?: string): string {
  if (err instanceof ApiError) return err.challenged && challenge ? challenge : err.message;
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE; // fetch rejects (offline/DNS/CORS)
  // A body res.json() couldn't read: a SyntaxError that quotes it, or WebKit's DOMException of that name.
  if (err instanceof SyntaxError || (err instanceof DOMException && err.name === 'SyntaxError')) return fallback;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface CollectibleImage {
  id: number;
  url: string;
  alt: string;
  order: number;
}

export interface Collectible {
  id: number;
  title: string;
  description: {
    type: 'text' | 'list';
    content?: string;
    items?: string[];
  };
  display_order: number;
  cycle: string;
  quantity: number;
  subtype: string | null;
  types: string[];
  images: CollectibleImage[];
}

export interface LocationWithCollectibles {
  level_id: number;
  location_id: number;
  location_name: string;
  location_order: number;
  collectibles: Collectible[];
}

export interface LevelWithLocations {
  level_id: number;
  level_name: string;
  level_order: number;
  type_id: number;
  locations: LocationWithCollectibles[];
}

export interface ContentImage {
  url: string;
  alt: string;
  order: number;
}

export interface BossInfo {
  name: string;
  balance_diamonds?: number;
  key_attacks?: string[];
}

export interface WalkthroughContent {
  order: number;
  section_title?: string;
  level?: string | null;
  location?: string | null;
  text: string;
  tip?: string;
  warning?: string;
  is_boss: boolean;
  boss_info?: BossInfo;
  images: ContentImage[];
}

export interface Walkthrough {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  level: string | null;
  mission_type: string;
  objectives: string[] | null;
  content: WalkthroughContent[];
  display_order: number;
  thumbnail_url: string | null;
  rewards: string[] | null;
  available_after: string | null;
}

export interface SearchResult {
  kind: 'collectibles' | 'upgrades' | 'cosmetics' | 'walkthrough' | 'level' | 'type' | 'walkthrough_type'
  id: number
  title: string
  snippet: string | null
  navigation_url: string
  score: number
}

export interface SearchResponse {
  query: string
  total: number
  results: SearchResult[]
  // The typo-corrected query the results are for, when the server corrected one
  corrected?: string | null
}

export interface WalkthroughListItem {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  level: string | null;
  mission_type: string;
  display_order: number;
  thumbnail_url: string | null;
  available_after: string | null;
}

// Mirrors ProgressWriteResponse in server/app/schemas/progress.py.
// already_complete / not_found are the no-op statuses: the write matched
// server state that the client's cache didn't predict (stale-cache signal).
export interface ProgressWriteResponse {
  status: 'added' | 'already_complete' | 'removed' | 'not_found'
  collectible_id: number
}

// Mirrors BulkProgressRequest / BulkPreviewResponse / BulkProgressResponse in
// server/app/schemas/progress.py. The target is a union so a request can only
// name the one target its scope takes; the server rejects any other shape.
export type BulkAction = 'clear' | 'mark_found'
export type BulkCycle = 'Base' | 'NG+' | 'NG++' | 'DLC'
export type BulkTarget =
  | { scope: 'everything' }
  | { scope: 'level'; level: string } // a level's exact name
  | { scope: 'type'; type: string } // a type's slug
export type BulkProgressRequest = BulkTarget & { action: BulkAction; cycle?: BulkCycle }

export interface BulkPreviewResponse {
  entries: number
  quantity: number // the Progress page's unit: a found ×N entry counts N
  scope_entries: number
  scope_ids: number[]
}

export interface BulkProgressResponse {
  entries: number
  quantity: number
}

// Mirrors UserStatsResponse in server/app/schemas/users.py
export interface CategoryStat {
  category: string
  completed: number
  total: number
}

export interface TypeStat {
  name: string
  slug: string
  category: string
  completed: number
  total: number
  cycles: string[] // the cycles its collectibles span, in display order
}

export interface LevelStat {
  name: string
  order: number
  completed: number
  total: number
  cycles: string[]
}

export interface CycleStat {
  name: string
  completed: number
  total: number
}

export interface UserStatsResponse {
  total: { completed: number; total: number }
  // Each collectible counted once per category group (dual-typed items are
  // NOT double-counted here, unlike the per-type rows); partitions the catalog.
  categories: CategoryStat[]
  types: TypeStat[]
  levels: LevelStat[]
  cycles: CycleStat[]
  // Sparse {collectible_id: quantity} for quantity > 1 entries only; keys are
  // strings on the wire (JSON object keys). All counts are quantity-weighted.
  quantity_overrides: Record<string, number>
  comments_posted: number
  member_since: string
}

/**
 * Read a non-OK Response into a friendly display message: a challenge's sentence,
 * fixed copy for 429 and 5xx (never leak internals or rate-limit jargon), otherwise
 * the API's own message, or the fallback for a body that isn't the API's. Use
 * wherever you fetch() directly instead of the api.* methods.
 */
export async function readError(response: Response, fallback: string): Promise<string> {
  return (await apiError(response, fallback)).message;
}

// The API's own error JSON (a detail or an error key), never Cloudflare's (cloudflare_error).
function isApiBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as { detail?: unknown; error?: unknown; cloudflare_error?: unknown };
  if (b.cloudflare_error === true) return false;
  return typeof b.detail === 'string' || Array.isArray(b.detail) || typeof b.error === 'string';
}

/** A non-OK Response as an ApiError: readError's message, plus who answered. */
export async function apiError(response: Response, fallback: string): Promise<ApiError> {
  if (response.headers.get('cf-mitigated') === 'challenge') {
    return new ApiError(response.status, CHALLENGE_MESSAGE, { challenged: true });
  }
  // Fixed copy, with no body read: nothing needs it, and a stalled body can't hang the caller.
  if (response.status === 429) return new ApiError(429, RATE_LIMIT_MESSAGE);
  if (response.status >= 500) return new ApiError(response.status, SERVER_ERROR_MESSAGE);
  const body: unknown = await response.json().catch(() => null);
  const fromServer = isApiBody(body);
  return new ApiError(response.status, getApiErrorMessage(fromServer ? body : null, fallback), { fromServer });
}

const handleResponse = async <T>(response: Response, context: string): Promise<T> => {
  if (!response.ok) {
    if (import.meta.env.DEV && response.status === 429) console.warn(`Rate limit hit on ${context}`);
    throw await apiError(response, `Failed to load ${context}`);
  }
  return response.json() as Promise<T>;
};

export const api = {
  // Levels
  getLevelCollectibles: async (levelName: string): Promise<LocationWithCollectibles[]> => {
    const response = await fetch(
      `${API_BASE_URL}/levels/${encodeURIComponent(levelName)}`
    );
    return handleResponse<LocationWithCollectibles[]>(response, 'level collectibles');
  },

  // Collectibles
  getCollectiblesByType: async (typeName: string): Promise<LevelWithLocations[]> => {
    const response = await fetch(
      `${API_BASE_URL}/collectibles/${encodeURIComponent(typeName)}`
    );
    return handleResponse<LevelWithLocations[]>(response, 'collectibles by type');
  },

  getUpgradesByType: async (typeName: string): Promise<LevelWithLocations[]> => {
    const response = await fetch(
      `${API_BASE_URL}/upgrades/${encodeURIComponent(typeName)}`
    );
    return handleResponse<LevelWithLocations[]>(response, 'upgrades by type');
  },

  getCosmeticsByType: async (typeName: string): Promise<LevelWithLocations[]> => {
    const response = await fetch(
      `${API_BASE_URL}/cosmetics/${encodeURIComponent(typeName)}`
    );
    return handleResponse<LevelWithLocations[]>(response, 'cosmetics by type');
  },

  // Walkthroughs
  getWalkthroughs: async (): Promise<WalkthroughListItem[]> => {
    const response = await fetch(
      `${API_BASE_URL}/walkthroughs/`
    );
    return handleResponse<WalkthroughListItem[]>(response, 'walkthroughs');
  },

  getWalkthroughsByType: async (type: string): Promise<WalkthroughListItem[]> => {
    const response = await fetch(
      `${API_BASE_URL}/walkthroughs/${encodeURIComponent(type)}`
    );
    return handleResponse<WalkthroughListItem[]>(response, 'walkthroughs by type');
  },

  getWalkthroughBySlug: async (type: string, slug: string): Promise<Walkthrough> => {
    const response = await fetch(
      `${API_BASE_URL}/walkthroughs/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`
    );
    return handleResponse<Walkthrough>(response, 'walkthrough');
  },

  searchAll: async (q: string, limit = 20, signal?: AbortSignal): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q, limit: String(limit) })
    const response = await fetch(`${API_BASE_URL}/search/?${params}`, { signal })
    return handleResponse<SearchResponse>(response, 'search')
  },
};