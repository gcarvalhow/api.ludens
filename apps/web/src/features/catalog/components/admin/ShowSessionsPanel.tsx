'use client';

import { CalendarPlus, RotateCw, TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';

import { useAdminShow } from '@catalog/hooks/queries';

import { SessionRow } from './SessionRow';

import type { AdminSession } from '@catalog/server/types';

interface ShowSessionsPanelProps {
  showId: string;
  onNewSession: (showId: string) => void;
  onEditSession: (showId: string, session: AdminSession) => void;
  onCancelSession: (session: AdminSession) => void;
  onDeleteSession: (session: AdminSession) => void;
}

export function ShowSessionsPanel({
  showId,
  onNewSession,
  onEditSession,
  onCancelSession,
  onDeleteSession,
}: ShowSessionsPanelProps) {
  const query = useAdminShow(showId);

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sessões</h3>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11"
          onClick={() => onNewSession(showId)}
        >
          <CalendarPlus />
          Nova sessão
        </Button>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Não foi possível carregar as sessões</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>Verifique sua conexão e tente novamente.</span>

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
      ) : null}

      {!query.isLoading && !query.isError ? (
        query.data && query.data.sessions.length > 0 ? (
          <ul>
            {query.data.sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onEdit={() => onEditSession(showId, session)}
                onCancel={() => onCancelSession(session)}
                onDelete={() => onDeleteSession(session)}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Nenhuma sessão. Um espetáculo sem sessão futura não aparece na
            vitrine.
          </p>
        )
      ) : null}
    </div>
  );
}
