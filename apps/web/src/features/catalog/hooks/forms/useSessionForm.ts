'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { toDateTimeLocalValue } from '@catalog/lib';
import { sessionFormSchema } from '@catalog/schemas';

import type { useAdminCatalogMutations } from '@catalog/hooks/mutations';
import type {
  AdminSession,
  SessionFormValues,
} from '@catalog/server/types';

type AdminCatalogMutations = ReturnType<
  typeof useAdminCatalogMutations
>;

const EMPTY: SessionFormValues = {
  starts_at: '',
  venue: '',
  capacity: 0,
  full_price: 0,
};

interface UseSessionFormParams {
  editing: AdminSession | null;
  showId: string | null;
  createSessionMutation: AdminCatalogMutations['createSessionMutation'];
  updateSessionMutation: AdminCatalogMutations['updateSessionMutation'];
  onSuccess: () => void;
}

export function useSessionForm({
  editing,
  showId,
  createSessionMutation,
  updateSessionMutation,
  onSuccess,
}: UseSessionFormParams) {
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    mode: 'onSubmit',
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        starts_at: toDateTimeLocalValue(editing.starts_at),
        venue: editing.venue,
        capacity: editing.capacity,
        full_price: editing.full_price,
      });
    } else {
      form.reset(EMPTY);
    }
  }, [editing, form]);

  const handleSubmit = form.handleSubmit((values) => {
    if (!showId) return;

    if (editing) {
      updateSessionMutation.mutate(
        { id: editing.id, showId, values },
        { onSuccess },
      );
    } else {
      createSessionMutation.mutate(
        { showId, values },
        { onSuccess },
      );
    }
  });

  return {
    form,
    handleSubmit,
    isPending:
      createSessionMutation.isPending ||
      updateSessionMutation.isPending,
  };
}
