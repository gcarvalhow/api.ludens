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

import type {
  SessionFormValues,
  ShowFormValues,
} from '@catalog/server/types';

export function useAdminCatalogMutations() {
  const queryClient = useQueryClient();

  // Invalida a chave-pai (`admin.shows()`) — cobre a listagem resumida e
  // qualquer detalhe de espetáculo aberto (`admin.show(id)`), já que os
  // dois são filhos dela. Mutation de sessão muda o detalhe; mutation de
  // espetáculo muda a listagem — mais simples invalidar os dois sempre.
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey:
        catalogQueryKeys.admin.shows(),
    });

  const createShowMutation = useMutation({
    mutationFn: (values: ShowFormValues) =>
      catalogService.createShow(values),

    onSuccess: () => {
      void invalidate();
      toast.success('Espetáculo criado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível criar o espetáculo.',
        ),
      ),
  });

  const updateShowMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: ShowFormValues;
    }) =>
      catalogService.updateShow(id, values),

    onSuccess: () => {
      void invalidate();
      toast.success('Espetáculo atualizado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível salvar o espetáculo.',
        ),
      ),
  });

  const publishShowMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.publishShow(id),

    onSuccess: () => {
      void invalidate();
      toast.success('Espetáculo publicado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível publicar o espetáculo.',
        ),
      ),
  });

  const unpublishShowMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.unpublishShow(id),

    onSuccess: () => {
      void invalidate();
      toast.success('Espetáculo despublicado.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível despublicar o espetáculo.',
        ),
      ),
  });

  const deleteShowMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.deleteShow(id),

    onSuccess: () => {
      void invalidate();
      toast.success('Espetáculo excluído.');
    },

    onError: (error) => {
      if (apiErrorStatus(error) === 409) {
        toast.error(
          'Há sessões com ingressos vendidos. Cancele essas sessões antes de excluir o espetáculo.',
        );
        return;
      }

      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível excluir o espetáculo.',
        ),
      );
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: ({
      showId,
      values,
    }: {
      showId: string;
      values: SessionFormValues;
    }) =>
      catalogService.createSession(
        showId,
        values,
      ),

    onSuccess: () => {
      void invalidate();
      toast.success('Sessão criada.');
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível criar a sessão.',
        ),
      ),
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({
      id,
      showId,
      values,
    }: {
      id: string;
      showId: string;
      values: SessionFormValues;
    }) =>
      catalogService.updateSession(
        id,
        showId,
        values,
      ),

    onSuccess: () => {
      void invalidate();
      toast.success('Sessão atualizada.');
    },

    onError: (error) => {
      if (apiErrorStatus(error) === 409) {
        toast.error(
          apiErrorMessage(
            error,
            'Já há ingressos comprometidos nesta sessão.',
          ),
        );
        return;
      }

      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível salvar a sessão.',
        ),
      );
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.cancelSession(id),

    onSuccess: () => {
      void invalidate();

      toast.success(
        'Sessão cancelada. Pedidos e ingressos foram cancelados e os compradores notificados (reembolso simulado).',
      );
    },

    onError: (error) =>
      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível cancelar a sessão.',
        ),
      ),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) =>
      catalogService.deleteSession(id),

    onSuccess: () => {
      void invalidate();
      toast.success('Sessão excluída.');
    },

    onError: (error) => {
      if (apiErrorStatus(error) === 409) {
        toast.error(
          'Esta sessão já vendeu ingressos. Cancele a sessão em vez de excluir — os pedidos serão cancelados (reembolso simulado).',
        );
        return;
      }

      toast.error(
        apiErrorMessage(
          error,
          'Não foi possível excluir a sessão.',
        ),
      );
    },
  });

  return {
    createShowMutation,
    updateShowMutation,
    publishShowMutation,
    unpublishShowMutation,
    deleteShowMutation,
    createSessionMutation,
    updateSessionMutation,
    cancelSessionMutation,
    deleteSessionMutation,
  };
}
