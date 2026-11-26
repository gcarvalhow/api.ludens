'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@components/ui/dialog';
import { useSessionDateOptions } from '@catalog/hooks/queries/useCatalogQueries';
import type { SessionDetail } from '@catalog/server/types';

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' });

export function SessionDatePicker({ session }: { session: SessionDetail }) {
  const [open, setOpen] = useState(false);
  const query = useSessionDateOptions(session.show.id, open);
  const alternatives = (query.data?.sessions ?? [])
    .filter(
      (option) =>
        option.id !== session.id &&
        option.status === 'on_sale' &&
        option.available_count > 0 &&
        option.starts_at.getTime() > Date.now(),
    )
    .sort((left, right) => left.starts_at.getTime() - right.starts_at.getTime());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="mt-2 min-h-11 w-fit gap-2 border-primary/30 text-primary"
        >
          <CalendarDays className="size-4" />
          Escolher outra data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Outras datas de {session.show.title}</DialogTitle>
          <DialogDescription>
            Escolha uma sessão futura com vagas. A lista começa pela data mais próxima.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Data atual: {DATE_TIME.format(session.starts_at)}
        </p>
        {query.isPending ? (
          <p role="status">Buscando outras datas...</p>
        ) : query.isError ? (
          <div role="alert" className="flex flex-col gap-3">
            <p>Não foi possível carregar outras datas.</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : alternatives.length === 0 ? (
          <p role="status">
            Não há outras datas futuras com vagas para este espetáculo no momento.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alternatives.map((option, index) => (
              <li key={option.id}>
                <Link
                  href={`/sessoes/${option.id}`}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{DATE_TIME.format(option.starts_at)}</span>
                  <span className="text-sm text-muted-foreground">{option.venue}</span>
                  <span className="flex flex-wrap items-center justify-between gap-2 text-sm text-primary">
                    <span>{option.available_count} ingresso(s) disponível(is)</span>
                    {index === 0 ? <span className="font-semibold">Mais próxima</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
