'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { showFormSchema } from '@catalog/schemas';

import type { useAdminCatalogMutations } from '@catalog/hooks/mutations';
import type {
  AdminShowSummary,
  ShowFormValues,
} from '@catalog/server/types';

type AdminCatalogMutations = ReturnType<
  typeof useAdminCatalogMutations
>;

const EMPTY: ShowFormValues = {
  title: '',
  synopsis: '',
  genre_id: '',
};

interface UseShowFormParams {
  editing: AdminShowSummary | null;
  createShowMutation: AdminCatalogMutations['createShowMutation'];
  updateShowMutation: AdminCatalogMutations['updateShowMutation'];
  onSuccess: () => void;
}

export function useShowForm({
  editing,
  createShowMutation,
  updateShowMutation,
  onSuccess,
}: UseShowFormParams) {
  const form = useForm<ShowFormValues>({
    resolver: zodResolver(showFormSchema),
    mode: 'onSubmit',
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        title: editing.title,
        synopsis: editing.synopsis,
        genre_id: editing.genre_id,
      });
    } else {
      form.reset(EMPTY);
    }
  }, [editing, form]);

  const handleSubmit = form.handleSubmit((values) => {
    if (editing) {
      updateShowMutation.mutate(
        { id: editing.id, values },
        { onSuccess },
      );
    } else {
      createShowMutation.mutate(values, { onSuccess });
    }
  });

  return {
    form,
    handleSubmit,
    isPending:
      createShowMutation.isPending ||
      updateShowMutation.isPending,
  };
}
