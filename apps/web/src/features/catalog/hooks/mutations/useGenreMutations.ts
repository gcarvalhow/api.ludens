'use client';

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { catalogQueryKeys } from '@catalog/hooks/queries';
import {
  apiErrorMessage,
  apiErrorStatus,
} from '@catalog/lib';
import { catalogService } from '@catalog/services';

import type { GenreFormValues } from '@catalog/server/types';

export function useGenreMutations() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.genres(),
    });

  const createGenreMutation = useMutation({
    mutationFn: (values: GenreFormValues) =>
      catalogService.createGenre(values),

    onSuccess: () => {
      void invalidate();
      toast.success('Gênero criado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível criar o gênero.',
        ),
      ),
  });

  const updateGenreMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: GenreFormValues;
    }) =>
      catalogService.updateGenre(id, values),

    onSuccess: () => {
      void invalidate();
      toast.success('Gênero atualizado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível salvar o gênero.',
        ),
      ),
  });

  const deleteGenreMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.deleteGenre(id),

    onSuccess: () => {
      void invalidate();
      toast.success('Gênero excluído.');
    },

    onError: (error) => {
      if (apiErrorStatus(error) === 409) {
        toast.error(
          apiErrorMessage(
            error,
            'Existem espetáculos usando este gênero; altere-os para outro gênero antes de excluir.',
          ),
        );
        return;
      }

      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível excluir o gênero.',
        ),
      );
    },
  });

  return {
    createGenreMutation,
    updateGenreMutation,
    deleteGenreMutation,
  };
}
