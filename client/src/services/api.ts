// // const API_BASE_URL = '/api';

// // export interface Level {
// //   id: number;
// //   name: string;
// //   display_order: number;
// // }

// // export interface Location {
// //   id: number;
// //   name: string;
// //   display_order: number;
// // }

// // export interface CollectibleImage {
// //   id: number;
// //   url: string;
// //   alt: string;
// //   order: number;
// // }

// // export interface Collectible {
// //   id: number;
// //   title: string;
// //   description: {
// //     type: 'text' | 'list';
// //     content?: string;
// //     items?: string[];
// //   };
// //   display_order: number;
// //   types: string[];
// //   images: CollectibleImage[];
// // }

// // export interface LocationWithCollectibles {
// //   location_id: number;
// //   location_name: string;
// //   location_order: number;
// //   collectibles: Collectible[];
// // }

// // export interface LevelWithLocations {
// //   level_id: number;
// //   level_name: string;
// //   level_order: number;
// //   locations: LocationWithCollectibles[];
// // }

// // export const api = {
// //   getLevels: async (): Promise<Level[]> => {
// //     const response = await fetch(`${API_BASE_URL}/levels/`);
// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch levels: ${response.status}`);
// //     }
// //     return response.json();
// //   },

// //   getLocations: async (levelName: string): Promise<Location[]> => {
// //     const response = await fetch(`${API_BASE_URL}/levels/${encodeURIComponent(levelName)}/locations`);
// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch locations: ${response.status}`);
// //     }
// //     return response.json();
// //   },

// //   getCollectibles: async (levelName: string, locationName: string): Promise<Collectible[]> => {
// //     const response = await fetch(
// //       `${API_BASE_URL}/collectibles/${encodeURIComponent(levelName)}/${encodeURIComponent(locationName)}`
// //     );
// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch collectibles: ${response.status}`);
// //     }
// //     return response.json();
// //   },

// //   getLevelCollectibles: async (levelName: string): Promise<LocationWithCollectibles[]> => {
// //     const response = await fetch(
// //       `${API_BASE_URL}/collectibles/levels/${encodeURIComponent(levelName)}`
// //     );
// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch level collectibles: ${response.status}`);
// //     }
// //     return response.json();
// //   },

// //   getCollectiblesByType: async (typeName: string): Promise<LevelWithLocations[]> => {
// //     const response = await fetch(
// //       `${API_BASE_URL}/collectibles/types/${encodeURIComponent(typeName)}`
// //     );
// //     if (!response.ok) {
// //       throw new Error(`Failed to fetch collectibles by type: ${response.status}`);
// //     }
// //     return response.json();
// //   },
// // };

// const API_BASE_URL = '/api';

// export interface Level {
//   id: number;
//   name: string;
//   display_order: number;
// }

// export interface Location {
//   id: number;
//   name: string;
//   display_order: number;
// }

// export interface CollectibleImage {
//   id: number;
//   url: string;
//   alt: string;
//   order: number;
// }

// export interface Collectible {
//   id: number;
//   title: string;
//   description: {
//     type: 'text' | 'list';
//     content?: string;
//     items?: string[];
//   };
//   display_order: number;
//   types: string[];
//   images: CollectibleImage[];
// }

// export interface LocationWithCollectibles {
//   location_id: number;
//   location_name: string;
//   location_order: number;
//   collectibles: Collectible[];
// }

// export interface LevelWithLocations {
//   level_id: number;
//   level_name: string;
//   level_order: number;
//   locations: LocationWithCollectibles[];
// }

// // Helper to handle API responses and log rate limits
// const handleResponse = async <T>(response: Response, context: string): Promise<T> => {
//   if (!response.ok) {
//     if (response.status === 429) {
//       console.warn(`Rate limit hit on ${context}`);
//       console.warn('This shouldn\'t happen in normal usage - check for bugs or infinite loops!');
//     }
//     throw new Error(`Failed to fetch ${context}: ${response.status}`);
//   }
//   return response.json();
// };

// export const api = {
//   getLevels: async (): Promise<Level[]> => {
//     const response = await fetch(`${API_BASE_URL}/levels/`);
//     return handleResponse<Level[]>(response, 'levels');
//   },

//   getLocations: async (levelName: string): Promise<Location[]> => {
//     const response = await fetch(`${API_BASE_URL}/levels/${encodeURIComponent(levelName)}/locations`);
//     return handleResponse<Location[]>(response, 'locations');
//   },

//   getCollectibles: async (levelName: string, locationName: string): Promise<Collectible[]> => {
//     const response = await fetch(
//       `${API_BASE_URL}/collectibles/${encodeURIComponent(levelName)}/${encodeURIComponent(locationName)}`
//     );
//     return handleResponse<Collectible[]>(response, 'collectibles');
//   },

//   getLevelCollectibles: async (levelName: string): Promise<LocationWithCollectibles[]> => {
//     const response = await fetch(
//       `${API_BASE_URL}/collectibles/levels/${encodeURIComponent(levelName)}`
//     );
//     return handleResponse<LocationWithCollectibles[]>(response, 'level collectibles');
//   },

//   getCollectiblesByType: async (typeName: string): Promise<LevelWithLocations[]> => {
//     const response = await fetch(
//       `${API_BASE_URL}/collectibles/types/${encodeURIComponent(typeName)}`
//     );
//     return handleResponse<LevelWithLocations[]>(response, 'collectibles by type');
//   },
// };

const API_BASE_URL = '/api';

// Custom error class to pass status code
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
  location_id: number;
  location_name: string;
  location_order: number;
  collectibles: Collectible[];
}

export interface LevelWithLocations {
  level_id: number;
  level_name: string;
  level_order: number;
  locations: LocationWithCollectibles[];
}

// export interface WalkthroughStep {
//   step_number: number;
//   instruction: string;
//   type: 'navigation' | 'combat' | 'objective' | 'boss' | 'dialogue';
//   combat_info?: {
//     enemies?: string[];
//     recommended_level?: number;
//     difficulty?: string;
//     balance_diamonds?: number;
//     phases?: number;
//     strategy?: string;
//     key_attacks?: string[];
//     key_mechanics?: string[];
//   };
//   notes: Array<{
//     type: 'tip' | 'warning' | 'collectible_reference';
//     content: string;
//     collectible_id?: number;
//     collectible_ids?: number[];
//   }>;
//   images: Array<{
//     url: string;
//     alt: string;
//     order: number;
//   }>;
// }

// export interface Walkthrough {
//   id: number;
//   type: string;
//   level: string | null;
//   title: string;
//   subtitle: string | null;
//   prerequisites: string[] | null;
//   rewards: string[] | null;
//   steps: WalkthroughStep[];
//   display_order: number;
// }

// export interface WalkthroughListItem {
//   id: number;
//   type: string;
//   level: string | null;
//   title: string;
//   subtitle: string | null;
//   display_order: number;
// }

// Replace the walkthrough interfaces
// export interface ContentImage {
//   url: string;
//   alt: string;
//   order: number;
// }

// export interface WalkthroughContent {
//   order: number;
//   text: string;
//   is_boss: boolean;
//   boss_tips?: string[];
//   images: ContentImage[];
// }

// export interface Walkthrough {
//   id: number;
//   title: string;
//   subtitle: string | null;
//   level: string | null;
//   mission_type: string;
//   objectives: string[] | null;
//   content: WalkthroughContent[];
//   display_order: number;
// }

// export interface WalkthroughListItem {
//   id: number;
//   title: string;
//   subtitle: string | null;
//   level: string | null;
//   mission_type: string;
//   display_order: number;
// }

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
  getLevels: async (): Promise<Level[]> => {
    const response = await fetch(`${API_BASE_URL}/levels/`);
    return handleResponse<Level[]>(response, 'levels');
  },

  getLocations: async (levelName: string): Promise<Location[]> => {
    const response = await fetch(`${API_BASE_URL}/levels/${encodeURIComponent(levelName)}/locations`);
    return handleResponse<Location[]>(response, 'locations');
  },

  getCollectibles: async (levelName: string, locationName: string): Promise<Collectible[]> => {
    const response = await fetch(
      `${API_BASE_URL}/collectibles/levels/${encodeURIComponent(levelName)}/locations/${encodeURIComponent(locationName)}`
    );
    return handleResponse<Collectible[]>(response, 'collectibles');
  },

  getLevelCollectibles: async (levelName: string): Promise<LocationWithCollectibles[]> => {
    const response = await fetch(
      `${API_BASE_URL}/collectibles/levels/${encodeURIComponent(levelName)}`
    );
    return handleResponse<LocationWithCollectibles[]>(response, 'level collectibles');
  },

  getCollectiblesByType: async (typeName: string, filterType?: string): Promise<LevelWithLocations[]> => {
    const query = filterType ? `?filter=${encodeURIComponent(filterType)}` : '';
    const response = await fetch(
      `${API_BASE_URL}/collectibles/types/${encodeURIComponent(typeName)}${query}`
    );
    return handleResponse<LevelWithLocations[]>(response, 'collectibles by type');
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
      `${API_BASE_URL}/walkthroughs/type/${encodeURIComponent(type)}`
    );
    return handleResponse<WalkthroughListItem[]>(response, 'walkthroughs by type');
  },

  getWalkthroughBySlug: async (type: string, slug: string): Promise<Walkthrough> => {
    const response = await fetch(
      `${API_BASE_URL}/walkthroughs/type/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`
    );
    return handleResponse<Walkthrough>(response, 'walkthrough');
  },

  getWalkthroughById: async (id: number): Promise<Walkthrough> => {
    const response = await fetch(`${API_BASE_URL}/walkthroughs/${id}`);
    return handleResponse<Walkthrough>(response, 'walkthrough');
  },
};