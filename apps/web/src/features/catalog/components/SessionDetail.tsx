'use client';

import { RotateCw } from 'lucide-react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';
import { Skeleton } from '@components/ui/skeleton';

import { useSessionDetail } from '@catalog/hooks/queries';
import { SessionDetailView } from '@catalog/components/ui';

interface SessionDetailProps {
  sessionId: string;
}

function SessionDetailLoadingState() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <Skeleton className="h-6 w-24 rounded-full" />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>

          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </main>
  );
}

export function SessionDetailComponent({
  sessionId,
}: SessionDetailProps) {
  const query = useSessionDetail(sessionId);

  if (query.isLoading) {
    return <SessionDetailLoadingState />;
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>
            Não foi possível carregar a sessão
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

  return <SessionDetailView session={query.data} />;
}
