export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/** Shown for failures the server can't describe specifically. */
export const NETWORK_ERROR_MESSAGE = 'You appear to be offline. Check your connection and try again.';
const RATE_LIMIT_MESSAGE = "You're doing that too fast. Please wait a moment and try again.";
const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.';

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
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE; // fetch rejects (offline/DNS/CORS)
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export interface Level {
  id: number;
  name: string;
  display_order: number;
}

export interface Location {
  id: number;
  name: string;
  display_order: number;
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
  kind: 'collectibles' | 'upgrades' | 'cosmetics' | 'materials' | 'walkthrough' | 'level'
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

/**
 * Read a non-OK Response into a friendly display message: fixed copy for 429 and
 * 5xx (never leak internals or rate-limit jargon), otherwise the server's own
 * message. Use wherever you fetch() directly instead of the api.* methods.
 */
export async function readError(response: Response, fallback: string): Promise<string> {
  if (response.status === 429) return RATE_LIMIT_MESSAGE;
  if (response.status >= 500) return SERVER_ERROR_MESSAGE; // never surface raw internals
  const body: unknown = await response.json().catch(() => null);
  return getApiErrorMessage(body, fallback);
}

const handleResponse = async <T>(response: Response, context: string): Promise<T> => {
  if (!response.ok) {
    if (import.meta.env.DEV && response.status === 429) console.warn(`Rate limit hit on ${context}`);
    throw new ApiError(response.status, await readError(response, `Failed to load ${context}`));
  }
  return response.json();
};

export const api = {
  // Levels
  getLevels: async (): Promise<Level[]> => {
    const response = await fetch(`${API_BASE_URL}/levels/`);
    return handleResponse<Level[]>(response, 'levels');
  },

  getLocations: async (levelName: string): Promise<Location[]> => {
    const response = await fetch(`${API_BASE_URL}/levels/${encodeURIComponent(levelName)}/locations`);
    return handleResponse<Location[]>(response, 'locations');
  },

  getLevelCollectibles: async (levelName: string): Promise<LocationWithCollectibles[]> => {
    const response = await fetch(
      `${API_BASE_URL}/levels/${encodeURIComponent(levelName)}`
    );
    return handleResponse<LocationWithCollectibles[]>(response, 'level collectibles');
  },

  getCollectibles: async (levelName: string, locationName: string): Promise<Collectible[]> => {
    const response = await fetch(
      `${API_BASE_URL}/levels/${encodeURIComponent(levelName)}/${encodeURIComponent(locationName)}`
    );
    return handleResponse<Collectible[]>(response, 'collectibles');
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

  getMaterialsByType: async (typeName: string): Promise<LevelWithLocations[]> => {
    const response = await fetch(
      `${API_BASE_URL}/materials/${encodeURIComponent(typeName)}`
    );
    return handleResponse<LevelWithLocations[]>(response, 'materials by type');
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