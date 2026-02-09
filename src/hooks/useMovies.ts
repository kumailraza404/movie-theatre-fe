import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { movieApi } from '../services/api';

export const useNowPlayingMovies = () => {
  return useInfiniteQuery({
    queryKey: ['movies', 'now-playing'],
    queryFn: ({ pageParam = 1 }) => movieApi.getNowPlaying(pageParam),
    getNextPageParam: (lastPage) => {
      // If there are more pages, return the next page number
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // No more pages
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useMovieDetails = (movieId: number | string | undefined) => {
  return useQuery({
    queryKey: ['movies', 'details', movieId],
    queryFn: () => {
      if (!movieId) throw new Error('Movie ID is required');
      const id = typeof movieId === 'string' ? parseInt(movieId, 10) : movieId;
      return movieApi.getMovieDetails(id);
    },
    enabled: !!movieId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
