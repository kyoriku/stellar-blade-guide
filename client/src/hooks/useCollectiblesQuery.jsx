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
