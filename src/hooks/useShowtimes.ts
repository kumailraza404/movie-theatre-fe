import { useQuery } from '@tanstack/react-query';
import { showtimeApi } from '../services/api';

export const useShowtimesByMovie = (movieId: string | number | undefined) => {
  return useQuery({
    queryKey: ['showtimes', 'movie', movieId],
    queryFn: () => {
      if (!movieId) throw new Error('Movie ID is required');
      const id = typeof movieId === 'number' ? movieId.toString() : movieId;
      return showtimeApi.getShowtimesByMovie(id);
    },
    enabled: !!movieId,
    staleTime: 2 * 60 * 1000, // 2 minutes (showtimes change frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useShowtimeById = (showtimeId: string | undefined) => {
  return useQuery({
    queryKey: ['showtimes', showtimeId],
    queryFn: () => {
      if (!showtimeId) throw new Error('Showtime ID is required');
      return showtimeApi.getShowtimeById(showtimeId);
    },
    enabled: !!showtimeId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
