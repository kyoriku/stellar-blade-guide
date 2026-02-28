const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
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
}

export interface CommentUser {
  id: number
  username: string
  avatar_url: string | null
  role: string
}

export interface Comment {
  id: number
  content_type: string
  content_id: number
  parent_id: number | null
  body: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  user: CommentUser | null
  replies?: Comment[]
}

export interface AuthUser {
  id: number
  email: string
  username: string
  avatar_url: string | null
  role: string
  created_at: string
}

const handleResponse = async <T>(response: Response, context: string): Promise<T> => {
  if (!response.ok) {
    if (import.meta.env.DEV && response.status === 429) {
      console.warn(`Rate limit hit on ${context}`);
      console.warn('This shouldn\'t happen in normal usage - check for bugs or infinite loops!');
    }

    throw new ApiError(response.status, `Failed to fetch ${context}`);
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

  getComments: async (contentType: string, contentId: number): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/comments/${contentType}/${contentId}`)
    return handleResponse<Comment[]>(response, 'comments')
  },

  postComment: async (token: string, body: { content_type: string; content_id: number; body: string; parent_id?: number }): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/comments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    return handleResponse<Comment>(response, 'post comment')
  },

  editComment: async (token: string, commentId: number, body: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body }),
    })
    return handleResponse<Comment>(response, 'edit comment')
  },

  deleteComment: async (token: string, commentId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new ApiError(response.status, 'Failed to delete comment')
  },

  forgotPassword: async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) throw new ApiError(response.status, 'Failed to send reset email')
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    })
    if (!response.ok) throw new ApiError(response.status, 'Failed to reset password')
  },
};