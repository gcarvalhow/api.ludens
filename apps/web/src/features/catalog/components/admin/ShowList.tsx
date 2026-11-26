'use client';

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@components/ui/card';
import { Separator } from '@components/ui/separator';

import { SHOW_STATUS_BADGE_VARIANT, SHOW_STATUS_LABELS } from '@catalog/constants';

import { ShowSessionsPanel } from './ShowSessionsPanel';

import type {
  AdminSession,
  AdminShowSummary,
} from '@catalog/server/types';

interface ShowListProps {
  shows: AdminShowSummary[];
  onEditShow: (show: AdminShowSummary) => void;
  onPublish: (show: AdminShowSummary) => void;
  onUnpublish: (show: AdminShowSummary) => void;
  onDeleteShow: (show: AdminShowSummary) => void;
  onNewSession: (showId: string) => void;
  onEditSession: (
    showId: string,
    session: AdminSession,
  ) => void;
  onCancelSession: (session: AdminSession) => void;
  onDeleteSession: (session: AdminSession) => void;
}

export function ShowList({
  shows,
  onEditShow,
  onPublish,
  onUnpublish,
  onDeleteShow,
  onNewSession,
  onEditSession,
  onCancelSession,
  onDeleteSession,
}: ShowListProps) {
  // A listagem só traz dados principais (GET /catalog/shows, resumo,
  // sem sessions) — as sessões de um espetáculo específico só são
  // buscadas (GET /catalog/shows/{id}) quando o admin entra nele,
  // expandindo o card. Mesmo padrão de navegação lista→detalhe do
  // catálogo público (mesmos endpoints, resposta varia pelo token).
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {shows.map((show) => {
        const isExpanded = expandedId === show.id;

        return (
          <Card
            key={show.id}
            className="border-t-2 border-t-primary/70"
          >
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-lg font-semibold">
                      {show.title}
                    </h2>

                    <Badge variant={SHOW_STATUS_BADGE_VARIANT[show.status]}>
                      {SHOW_STATUS_LABELS[show.status]}
                    </Badge>
                  </div>

                  <span className="text-sm text-muted-foreground">
                    {show.genre}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-11"
                    onClick={() => onEditShow(show)}
                  >
                    <Pencil />
                    Editar
                  </Button>

                  {show.status === 'draft' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                      onClick={() => onPublish(show)}
                    >
                      <Eye />
                      Publicar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11"
                      onClick={() => onUnpublish(show)}
                    >
                      <EyeOff />
                      Despublicar
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="min-h-11"
                    onClick={() => onDeleteShow(show)}
                  >
                    <Trash2 />
                    Excluir
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {show.synopsis}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 w-fit"
                onClick={() =>
                  setExpandedId(isExpanded ? null : show.id)
                }
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
                {isExpanded ? 'Ocultar sessões' : 'Gerenciar sessões'}
              </Button>
            </CardHeader>

            {isExpanded ? (
              <>
                <Separator />

                <CardContent>
                  <ShowSessionsPanel
                    showId={show.id}
                    onNewSession={onNewSession}
                    onEditSession={onEditSession}
                    onCancelSession={onCancelSession}
                    onDeleteSession={onDeleteSession}
                  />
                </CardContent>
              </>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
