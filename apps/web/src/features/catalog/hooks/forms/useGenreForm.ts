'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { genreFormSchema } from '@catalog/schemas';

import type { useGenreMutations } from '@catalog/hooks/mutations';
import type {
  Genre,
  GenreFormValues,
} from '@catalog/server/types';

type GenreMutations = ReturnType<typeof useGenreMutations>;

const EMPTY: GenreFormValues = {
  name: '',
};

interface UseGenreFormParams {
  editing: Genre | null;
  createGenreMutation: GenreMutations['createGenreMutation'];
  updateGenreMutation: GenreMutations['updateGenreMutation'];
  onSuccess: () => void;
}

export function useGenreForm({
  editing,
  createGenreMutation,
  updateGenreMutation,
  onSuccess,
}: UseGenreFormParams) {
  const form = useForm<GenreFormValues>({
    resolver: zodResolver(genreFormSchema),
    mode: 'onSubmit',
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (editing) {
      form.reset({ name: editing.name });
    } else {
      form.reset(EMPTY);
    }
  }, [editing, form]);

  const handleSubmit = form.handleSubmit((values) => {
    if (editing) {
      updateGenreMutation.mutate(
        { id: editing.id, values },
        { onSuccess },
      );
    } else {
      createGenreMutation.mutate(values, { onSuccess });
    }
  });

  return {
    form,
    handleSubmit,
    isPending:
      createGenreMutation.isPending ||
      updateGenreMutation.isPending,
  };
}
