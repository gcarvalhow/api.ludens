'use client';

import { CalendarDays, Tags } from 'lucide-react';

import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

import { useGenreList } from '@catalog/hooks/queries';
import { useShowFilters } from '@catalog/hooks';

const ALL_GENRES = 'all';

export function ShowFilters() {
  const { filters, setFilters } = useShowFilters();
  const genresQuery = useGenreList();

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="filter-from-date"
          className="gap-1.5"
        >
          <CalendarDays className="size-3.5 text-primary" />
          A partir de
        </Label>

        <Input
          id="filter-from-date"
          type="date"
          value={filters.fromDate ?? ''}
          onChange={(event) =>
            setFilters({
              fromDate:
                event.target.value || undefined,
            })
          }
          className="min-h-11 border-primary/30"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="filter-genre"
          className="gap-1.5"
        >
          <Tags className="size-3.5 text-primary" />
          Gênero
        </Label>

        <Select
          value={filters.genre ?? ALL_GENRES}
          onValueChange={(value) =>
            setFilters({
              genre:
                value === ALL_GENRES
                  ? undefined
                  : value,
            })
          }
        >
          <SelectTrigger
            id="filter-genre"
            className="min-h-11 w-40 border-primary/30"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL_GENRES}>
              Todos
            </SelectItem>

            {(genresQuery.data ?? []).map(
              (genre) => (
                <SelectItem
                  key={genre.id}
                  value={genre.id}
                >
                  {genre.name}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
