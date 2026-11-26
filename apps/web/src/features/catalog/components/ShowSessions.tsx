'use client';

import { RotateCw } from 'lucide-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';

import { useShowDetail } from '@catalog/hooks/queries';
import { ShowSessionsView } from '@catalog/components/ui';

interface ShowSessionsProps {
  showId: string;
}

function ShowSessionsLoadingState() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />

        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </main>
  );
}

export function ShowSessions({
  showId,
}: ShowSessionsProps) {
  const query = useShowDetail(showId);

  if (query.isLoading) {
    return <ShowSessionsLoadingState />;
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>
            Não foi possível carregar o espetáculo
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
      </main>
    );
  }

  return <ShowSessionsView show={query.data} />;
}
