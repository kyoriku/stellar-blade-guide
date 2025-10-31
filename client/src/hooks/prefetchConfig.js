/**
 * Configuration for component prefetching
 * 
 * This file defines which components should be prefetched for each route
 * to optimize loading performance.
 */

// Main components to prefetch
const prefetchImports = {
  // Level-specific prefetching
  'eidos-7': [
    // Main container component
    () => import('../pages/Collectibles/LevelCollectibles'),
    
    // Most important sections for Eidos 7
    () => import('../pages/Collectibles/Eidos7/SilentStreet'),
    () => import('../pages/Collectibles/Eidos7/ParkingTower'),
    
    // Only prefetch the first couple of sections to avoid excessive network usage
    // Other sections will be loaded when needed
  ],
  
  'xion': [
    () => import('../pages/Collectibles/LevelCollectibles'),
    () => import('../pages/Collectibles/Xion/Xion'),
    () => import('../pages/Collectibles/Xion/XionContinued'),
  ],
  
  // Add other levels as needed
};

export default prefetchImports;