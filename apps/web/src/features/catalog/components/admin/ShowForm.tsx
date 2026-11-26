'use client';

import Link from 'next/link';

import { Sparkles } from 'lucide-react';
import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';

import { useGenreList } from '@catalog/hooks/queries';

import type { ShowFormValues } from '@catalog/server/types';

interface ShowFormProps {
  form: UseFormReturn<ShowFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isPending: boolean;
  mode: 'create' | 'edit';
}

export function ShowForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  mode,
}: ShowFormProps) {
  const genresQuery = useGenreList();
  const genres = genresQuery.data ?? [];

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {mode === 'create' ? (
          <p className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            A imagem de capa é sorteada automaticamente do pool
            padrão assim que o espetáculo é criado.
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex.: Hamlet"
                  disabled={isPending}
                  className="min-h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="synopsis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sinopse</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Do que se trata o espetáculo?"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genre_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria / gênero</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || genres.length === 0}
                >
                  <SelectTrigger className="min-h-11 w-full">
                    <SelectValue placeholder="Selecione um gênero" />
                  </SelectTrigger>

                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem
                        key={genre.id}
                        value={genre.id}
                      >
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>

              {!genresQuery.isLoading && genres.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum gênero cadastrado —{' '}
                  <Link
                    href="/admin/generos"
                    className="underline underline-offset-2"
                  >
                    crie um primeiro
                  </Link>
                  .
                </p>
              ) : null}

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            className="min-h-11 px-5"
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
