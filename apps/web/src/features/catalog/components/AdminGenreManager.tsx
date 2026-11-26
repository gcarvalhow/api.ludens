'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  Plus,
  RotateCw,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Skeleton } from '@components/ui/skeleton';
import { LogoIcon } from '@components/LogoIcon';

import {
  GenreForm,
  GenreTable,
} from '@catalog/components/admin';
import { useGenreForm } from '@catalog/hooks/forms';
import { useGenreMutations } from '@catalog/hooks/mutations';
import { useGenreList } from '@catalog/hooks/queries';

import type { Genre } from '@catalog/server/types';

type GenrePanel =
  | { mode: 'create' }
  | { mode: 'edit'; genre: Genre }
  | null;

function GenreLoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AdminGenreManager() {
  const query = useGenreList();

  const {
    createGenreMutation,
    updateGenreMutation,
    deleteGenreMutation,
  } = useGenreMutations();

  const [genrePanel, setGenrePanel] =
    useState<GenrePanel>(null);

  const genreForm = useGenreForm({
    editing:
      genrePanel?.mode === 'edit'
        ? genrePanel.genre
        : null,
    createGenreMutation,
    updateGenreMutation,
    onSuccess: () => setGenrePanel(null),
  });

  const genres = query.data ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Painel administrativo
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fae9e9] p-2">
            <LogoIcon className="size-full" />
          </span>

          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Gêneros
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as categorias usadas pelos espetáculos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="min-h-11 px-4" asChild>
            <Link href="/admin/espetaculos">
              <ArrowLeft />
              Voltar aos espetáculos
            </Link>
          </Button>

          <Button
            type="button"
            className="min-h-11 px-4"
            onClick={() => setGenrePanel({ mode: 'create' })}
          >
            <Plus />
            Novo gênero
          </Button>
        </div>
      </div>

      {query.isLoading ? <GenreLoadingState /> : null}

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Não foi possível carregar os gêneros</AlertTitle>
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
        genres.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#fae9e9] p-2.5">
              <LogoIcon className="size-full" />
            </span>

            <div className="space-y-1">
              <p className="font-medium">
                Nenhum gênero cadastrado ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Crie o primeiro para poder categorizar os espetáculos.
              </p>
            </div>

            <Button
              type="button"
              className="min-h-11 px-4"
              onClick={() => setGenrePanel({ mode: 'create' })}
            >
              <Plus />
              Novo gênero
            </Button>
          </div>
        ) : (
          <GenreTable
            genres={genres}
            onEditGenre={(genre) =>
              setGenrePanel({ mode: 'edit', genre })
            }
            onDeleteGenre={(genre) =>
              deleteGenreMutation.mutate(genre.id)
            }
          />
        )
      ) : null}

      <Dialog
        open={genrePanel !== null}
        onOpenChange={(open) => {
          if (!open && !genreForm.isPending) setGenrePanel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {genrePanel?.mode === 'edit'
                ? 'Editar gênero'
                : 'Novo gênero'}
            </DialogTitle>
            <DialogDescription>
              O nome do gênero aparece na vitrine pública e no
              cadastro de espetáculos.
            </DialogDescription>
          </DialogHeader>

          <GenreForm
            form={genreForm.form}
            onSubmit={genreForm.handleSubmit}
            onCancel={() => setGenrePanel(null)}
            isPending={genreForm.isPending}
            mode={genrePanel?.mode === 'edit' ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
