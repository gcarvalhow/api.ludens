import Link from 'next/link';

import { CalendarDays } from 'lucide-react';

import { Badge } from '@components/ui/badge';
import { Card, CardContent } from '@components/ui/card';

import { formatPriceBRL } from '@catalog/lib';

import type { ShowCardModel } from '@catalog/server/types';

interface ShowCardProps {
  show: ShowCardModel;
}

const SHORT_DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

export function ShowCard({ show }: ShowCardProps) {
  const priceLabel =
    show.price_min === show.price_max
      ? formatPriceBRL(show.price_min)
      : `${formatPriceBRL(show.price_min)} – ${formatPriceBRL(show.price_max)}`;

  return (
    <Link
      href={`/espetaculos/${show.id}`}
      className="block"
    >
      <Card className="h-full gap-3 border-t-2 border-t-primary/70 transition hover:shadow-md">
        <img
          src={show.image_url}
          alt={show.title}
          className="aspect-[3/4] w-full object-cover"
        />

        <CardContent className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-base font-semibold">
              {show.title}
            </h3>

            <Badge
              variant="outline"
              className="shrink-0 border-primary/40 text-primary"
            >
              {show.genre}
            </Badge>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {show.synopsis_short}
          </p>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-primary" />
            {show.upcoming_dates
              .slice(0, 3)
              .map((date) => SHORT_DATE.format(date))
              .join(' · ')}
          </p>

          <p className="mt-auto text-sm font-medium">
            {priceLabel}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}