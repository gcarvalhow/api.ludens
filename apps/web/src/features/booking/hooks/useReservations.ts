'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@account/contexts/AuthContext';
import { reservationService } from '@booking/services/reservation.service';

export function useMyReservations(page: number) {
  const { userId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['booking', userId, 'list', page],
    queryFn: () => reservationService.list(page),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });
}

export function useReservation(id: string) {
  const { userId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['booking', userId, 'detail', id],
    queryFn: () => reservationService.get(id),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });
}

export function useRebookingOptions(reservationId: string) {
  const { userId, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['booking', userId, 'rebooking-options', reservationId],
    queryFn: () => reservationService.rebookingOptions(reservationId),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: false,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useReservationMutations() {
  const client = useQueryClient();
  const { userId } = useAuth();
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['booking', userId] }),
      client.invalidateQueries({ queryKey: ['catalog'] }),
    ]);
  };
  return {
    create: useMutation({
      mutationFn: reservationService.create,
      onSuccess: invalidate,
      onError: invalidate,
    }),
    cancel: useMutation({ mutationFn: reservationService.cancel, onSuccess: invalidate }),
  };
}
