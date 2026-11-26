import { queryOptions } from '@tanstack/react-query';

import { catalogService } from '@catalog/services';

import type { ShowFilterParams } from '@catalog/services/show.service';

export const catalogQueryKeys = {
  all: ['catalog'] as const,

  shows: (filters: ShowFilterParams) =>
    [
      ...catalogQueryKeys.all,
      'shows',
      filters,
    ] as const,

  genres: () =>
  [...catalogQueryKeys.all, 'genres'] as const,

showDetail: (showId: string) =>
  [
    ...catalogQueryKeys.all,
    'show',
    showId,
  ] as const,

sessionDetail: (sessionId: string) =>
  [
    ...catalogQueryKeys.all,
    'session',
    sessionId,
  ] as const,


  admin: {
    shows: () =>
      [
        ...catalogQueryKeys.all,
        'admin',
        'shows',
      ] as const,

    showList: () =>
      [
        ...catalogQueryKeys.admin.shows(),
        'list',
      ] as const,

    show: (id: string) =>
      [
        ...catalogQueryKeys.admin.shows(),
        'detail',
        id,
      ] as const,
  },
};

export const catalogQueryOptions = {
  showList: (filters: ShowFilterParams) =>
    queryOptions({
      queryKey:
        catalogQueryKeys.shows(filters),
      queryFn: () =>
        catalogService.fetchShows(filters),
    }),

  genreList: () =>
    queryOptions({
      queryKey: catalogQueryKeys.genres(),
      queryFn: () =>
        catalogService.fetchGenres(),
      staleTime: 60_000,
    }),
    showDetail: (showId: string) =>
  queryOptions({
    queryKey:
      catalogQueryKeys.showDetail(showId),
    queryFn: () =>
      catalogService.fetchShowById(showId),
    refetchInterval: 15_000,
  }),

sessionDetail: (sessionId: string) =>
  queryOptions({
    queryKey:
      catalogQueryKeys.sessionDetail(sessionId),
    queryFn: () =>
      catalogService.fetchSessionById(sessionId),
    refetchInterval: 15_000,
    staleTime: 5_000,
  }),

  adminShowList: () =>
    queryOptions({
      queryKey:
        catalogQueryKeys.admin.showList(),
      queryFn: () =>
        catalogService.listAdminShows(),
      staleTime: 10_000,
    }),

  adminShow: (id: string) =>
    queryOptions({
      queryKey: catalogQueryKeys.admin.show(id),
      queryFn: () => catalogService.getAdminShow(id),
      staleTime: 10_000,
    }),
};
