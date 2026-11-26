import {
  dehydrate,
  HydrationBoundary,
} from '@tanstack/react-query';

import { ShowGrid } from '@catalog/components';
import { catalogQueryOptions } from '@catalog/hooks/queries';
import type { ShowFilterParams } from '@catalog/services';

import { getQueryClient } from '@web/lib/get-query-client';

interface HomePageProps {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}

function toFilters(
  params: Record<
    string,
    string | string[] | undefined
  >,
): ShowFilterParams {
  const first = (
    value: string | string[] | undefined,
  ) => (Array.isArray(value) ? value[0] : value);

  const filters: ShowFilterParams = {
    page: Number(first(params.page) ?? '1'),
    size: 12,
  };

  const fromDate = first(params.fromDate);
  const genre = first(params.genre);

  if (fromDate) {
    filters.fromDate = fromDate;
  }

  if (genre) {
    filters.genre = genre;
  }

  return filters;
}

export default async function HomePage({
  searchParams,
}: HomePageProps) {
  const filters = toFilters(await searchParams);
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      catalogQueryOptions.showList(filters),
    ),
    queryClient.prefetchQuery(
      catalogQueryOptions.genreList(),
    ),
  ]);

  return (
    <HydrationBoundary
      state={dehydrate(queryClient)}
    >
      <ShowGrid />
    </HydrationBoundary>
  );
}