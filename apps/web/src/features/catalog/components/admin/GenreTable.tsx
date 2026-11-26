'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@components/ui/button';
import { Card, CardContent } from '@components/ui/card';

import type { Genre } from '@catalog/server/types';

interface GenreTableProps {
  genres: Genre[];
  onEditGenre: (genre: Genre) => void;
  onDeleteGenre: (genre: Genre) => void;
}

export function GenreTable({
  genres,
  onEditGenre,
  onDeleteGenre,
}: GenreTableProps) {
  return (
    <div className="flex flex-col gap-3">
      {genres.map((genre) => (
        <Card key={genre.id} className="border-t-2 border-t-primary/70">
          <CardContent className="flex items-center justify-between gap-3">
            <span className="font-medium">{genre.name}</span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditGenre(genre)}
              >
                <Pencil />
                Editar
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDeleteGenre(genre)}
              >
                <Trash2 />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
