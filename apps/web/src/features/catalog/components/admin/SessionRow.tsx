'use client';

import {
  CalendarClock,
  MapPin,
  Users,
} from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';

import {
  SESSION_STATUS_BADGE_VARIANT,
  SESSION_STATUS_LABELS,
} from '@catalog/constants';
import {
  formatDateTime,
  formatPriceBRL,
} from '@catalog/lib';

import type { AdminSession } from '@catalog/server/types';

interface SessionRowProps {
  session: AdminSession;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function SessionRow({
  session,
  onEdit,
  onCancel,
  onDelete,
}: SessionRowProps) {
  const canCancel = session.status === 'on_sale';

  return (
    <li className="flex flex-col gap-3 border-t border-border/60 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <CalendarClock className="size-4 text-primary" />
          {formatDateTime(session.starts_at)}
        </span>

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-4" />
          {session.venue}
        </span>

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-4" />
          {session.tickets_sold} / {session.capacity}
        </span>

        <span className="text-muted-foreground">
          Inteira {formatPriceBRL(session.full_price)} · Meia{' '}
          {formatPriceBRL(session.half_price)}
        </span>

        <Badge variant={SESSION_STATUS_BADGE_VARIANT[session.status]}>
          {SESSION_STATUS_LABELS[session.status]}
        </Badge>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={onEdit}
        >
          Editar
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
          onClick={onCancel}
          disabled={!canCancel}
          title={
            canCancel
              ? undefined
              : 'Só sessões à venda podem ser canceladas'
          }
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="min-h-11"
          onClick={onDelete}
          disabled={!session.can_delete}
          title={
            session.can_delete
              ? undefined
              : 'Sessão com ingressos vendidos não pode ser excluída — cancele em vez disso'
          }
        >
          Excluir
        </Button>
      </div>
    </li>
  );
}
