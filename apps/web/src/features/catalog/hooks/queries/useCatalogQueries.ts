'use client';

import { useQuery } from '@tanstack/react-query';

import type { ShowFilterParams } from '@catalog/services';

import { catalogQueryOptions } from './query-options';

export function useShowList(
  filters: ShowFilterParams,
) {
  return useQuery(
    catalogQueryOptions.showList(filters),
  );
}

export function useGenreList() {
  return useQuery(
    catalogQueryOptions.genreList(),
  );
}

export function useShowDetail(showId: string) {
  return useQuery(
    catalogQueryOptions.showDetail(showId),
  );
}

export function useSessionDateOptions(showId: string, enabled: boolean) {
  return useQuery({
    ...catalogQueryOptions.showDetail(showId),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useSessionDetail(sessionId: string) {
  return useQuery(
    catalogQueryOptions.sessionDetail(sessionId),
  );
}

export function useAdminShowList() {
  return useQuery(
    catalogQueryOptions.adminShowList(),
  );
}

export function useAdminShow(id: string | null) {
  return useQuery({
    ...catalogQueryOptions.adminShow(id ?? ''),
    enabled: id !== null,
  });
}
