import Link from 'next/link';

import { CalendarDays, ChevronRight, MapPin } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Card, CardContent } from '@components/ui/card';

import { formatDateTime } from '@catalog/lib';

import type { ShowDetail } from '@catalog/server/types';

interface ShowSessionsViewProps {
  show: ShowDetail;
}

export function ShowSessionsView({
  show,
}: ShowSessionsViewProps) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <section className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <img
          src={show.image_url}
          alt={show.title}
          className="aspect-[3/4] w-full rounded-xl object-cover"
        />

        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            {show.genre}
          </Badge>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {show.title}
          </h1>

          <p className="text-muted-foreground">
            {show.synopsis}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">
          Sessões
        </h2>

        {show.sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
            <CalendarDays className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão disponível no momento.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {show.sessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessoes/${session.id}`}
                className="block"
              >
                <Card className="transition hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 font-medium">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateTime(session.starts_at)}
                      </span>

                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4" />
                        {session.venue}
                      </span>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
