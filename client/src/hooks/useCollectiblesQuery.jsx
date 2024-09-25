// import { useQuery, useQueryClient } from 'react-query';
// import { getCollectiblesByLevelAndLocation } from '../utils/API/collectibles';

// const staleTime = 1000 * 60 * 60 * 24; // 24 hours
// const cacheTime = 1000 * 60 * 60 * 24; // 24 hours

// export const useCollectiblesQuery = (level, location) => {
//   const queryClient = useQueryClient();

//   return useQuery(
//     ["collectibles", level, location],
//     () => getCollectiblesByLevelAndLocation(level, location),
//     {
//       staleTime,
//       cacheTime,
//       initialData: () => {
//         return queryClient.getQueryData(["collectibles", level, location]);
//       },
//       initialDataUpdatedAt: () => {
//         return queryClient.getQueryState(["collectibles", level, location])?.dataUpdatedAt;
//       },
//     }
//   );
// };

// export default useCollectiblesQuery;

// import { useQuery, useQueryClient } from 'react-query';
// import { getCollectiblesByLevelAndLocation } from '../utils/API/collectibles';

// const staleTime = 1000 * 60 * 60 * 24; // 24 hours
// const cacheTime = 1000 * 60 * 60 * 24; // 24 hours

// export const useCollectiblesQuery = (level, location) => {
//   const queryClient = useQueryClient();

//   return useQuery(
//     ["collectibles", level, location],
//     () => getCollectiblesByLevelAndLocation(level, location),
//     {
//       staleTime,
//       cacheTime,
//       refetchOnWindowFocus: false, // Avoid refetching when the window regains focus
//       refetchOnMount: false, // Prevent refetching when the component mounts
//       refetchOnReconnect: false, // Avoid refetching when the user reconnects to the internet
//       initialData: () => {
//         return queryClient.getQueryData(["collectibles", level, location]);
//       },
//       initialDataUpdatedAt: () => {
//         return queryClient.getQueryState(["collectibles", level, location])?.dataUpdatedAt;
//       },
//       enabled: queryClient.getQueryData(["collectibles", level, location]) === undefined, // Only fetch if data is not cached
//     }
//   );
// };

// export default useCollectiblesQuery;

import { useQuery, useQueryClient } from 'react-query';
import { getCollectiblesByLevelAndLocation } from '../utils/API/collectibles';

const staleTime = 1000 * 60 * 60 * 24; // 24 hours
const cacheTime = 1000 * 60 * 60 * 24; // 24 hours

export const useCollectiblesQuery = (level, location) => {
  const queryClient = useQueryClient();

  return useQuery(
    ["collectibles", level, location],
    () => getCollectiblesByLevelAndLocation(level, location),
    {
      staleTime,
      cacheTime,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      initialData: () => {
        return queryClient.getQueryData(["collectibles", level, location]);
      },
      initialDataUpdatedAt: () => {
        return queryClient.getQueryState(["collectibles", level, location])?.dataUpdatedAt;
      },
      enabled: queryClient.getQueryData(["collectibles", level, location]) === undefined,
      onSuccess: (data) => {
        // Cache images
        data.forEach(collectible => {
          collectible.images.forEach(image => {
            const img = new Image();
            img.src = image.src; // Preload the image
          });
        });
      },
    }
  );
};

export default useCollectiblesQuery;
