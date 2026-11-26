'use client';

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import {
  useCallback,
  useMemo,
} from 'react';

import type { ShowFilterParams } from '@catalog/services';

const DEFAULT_SIZE = 12;

type ShowFilterUpdates = {
  fromDate?: string | undefined;
  genre?: string | undefined;
  page?: number | undefined;
};

export function useShowFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: ShowFilterParams = useMemo(() => {
    const fromDate = searchParams.get('fromDate');
    const genre = searchParams.get('genre');

    return {
      ...(fromDate ? { fromDate } : {}),
      ...(genre ? { genre } : {}),
      page: Number(
        searchParams.get('page') ?? '1',
      ),
      size: DEFAULT_SIZE,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (next: ShowFilterUpdates) => {
      const params = new URLSearchParams(
        searchParams.toString(),
      );

      const merged = {
        ...filters,
        ...next,
      };

      if (merged.fromDate) {
        params.set(
          'fromDate',
          merged.fromDate,
        );
      } else {
        params.delete('fromDate');
      }

      if (merged.genre) {
        params.set(
          'genre',
          merged.genre,
        );
      } else {
        params.delete('genre');
      }

      if ('page' in next) {
        params.set(
          'page',
          String(next.page ?? 1),
        );
      } else {
        params.delete('page');
      }

      router.push(
        `${pathname}?${params.toString()}`,
      );
    },
    [
      filters,
      pathname,
      router,
      searchParams,
    ],
  );

  return {
    filters,
    setFilters,
  };
}