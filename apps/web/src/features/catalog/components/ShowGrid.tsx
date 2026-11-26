'use client';

import { RotateCw } from 'lucide-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { LogoIcon } from '@components/LogoIcon';

import {
  Pagination,
  ShowCard,
} from '@catalog/components/ui';
import { useShowFilters } from '@catalog/hooks';
import { useShowList } from '@catalog/hooks/queries';

import { ShowFilters } from './ShowFilters';

function ShowGridLoadingState() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ShowGrid() {
  const { filters, setFilters } = useShowFilters();
  const query = useShowList(filters);

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center gap-3 rounded-2xl border border-border border-b-2 border-b-primary bg-card p-6 sm:p-8">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fae9e9] p-2.5">
          <LogoIcon className="size-full" />
        </span>

        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Espetáculos em cartaz
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Encontre a próxima sessão do seu espetáculo favorito.
          </p>
        </div>
      </div>

      <ShowFilters />

      {query.isLoading ? (
        <ShowGridLoadingState />
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertTitle>
            Não foi possível carregar os espetáculos
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Verifique sua conexão e tente novamente.
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 w-fit"
              onClick={() => void query.refetch()}
            >
              <RotateCw />
              Tentar de novo
            </Button>
          </AlertDescription>
        </Alert>
      ) : query.data &&
        query.data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#fae9e9] p-2.5">
            <LogoIcon className="size-full" />
          </span>

          <p className="text-sm text-muted-foreground">
            Nenhum espetáculo em cartaz para esse filtro.
          </p>
        </div>
      ) : query.data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {query.data.items.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
              />
            ))}
          </div>

          <Pagination
            page={query.data.page}
            size={query.data.size}
            total={query.data.total}
            onPageChange={(page) =>
              setFilters({ page })
            }
          />
        </>
      ) : null}
    </section>
  );
}
