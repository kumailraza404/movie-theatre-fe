import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Reservation, reservationApi, Seat, SeatAvailability } from '../services/api';

export type { Reservation, Seat, SeatAvailability };

export const useMyReservations = () => {
  return useQuery({
    queryKey: ['reservations', 'my-reservations'],
    queryFn: () => reservationApi.getMyReservations(),
    staleTime: 30 * 1000, // 30 seconds (frequently changing)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute to update countdown timers
  });
};

export const useSeatAvailability = (showtimeId: string | undefined) => {
  return useQuery({
    queryKey: ['reservations', 'seat-availability', showtimeId],
    queryFn: () => {
      if (!showtimeId) throw new Error('Showtime ID is required');
      return reservationApi.getSeatAvailability(showtimeId);
    },
    enabled: !!showtimeId,
    staleTime: 10 * 1000, // 10 seconds (very frequently changing)
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useHoldSeats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ showtimeId, seats }: { showtimeId: string; seats: Seat[] }) =>
      reservationApi.holdSeats(showtimeId, seats),
    onSuccess: (data, variables) => {
      // Invalidate seat availability to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['reservations', 'seat-availability', variables.showtimeId] });
      // Invalidate my reservations to show the new hold
      queryClient.invalidateQueries({ queryKey: ['reservations', 'my-reservations'] });
      console.log('Hold seats success', data);
    },
  });
};

export const useConfirmReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => reservationApi.confirmReservation(reservationId),
    onSuccess: () => {
      // Invalidate my reservations to update the list
      queryClient.invalidateQueries({ queryKey: ['reservations', 'my-reservations'] });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reservationId: string) => reservationApi.cancelReservation(reservationId),
    onSuccess: () => {
      // Invalidate my reservations to update the list
      queryClient.invalidateQueries({ queryKey: ['reservations', 'my-reservations'] });
      // Also invalidate seat availability queries (in case we know which showtime)
      queryClient.invalidateQueries({ queryKey: ['reservations', 'seat-availability'] });
    },
  });
};
