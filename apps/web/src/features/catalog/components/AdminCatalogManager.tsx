'use client';

import Link from 'next/link';

import {
  ArrowLeft,
  Plus,
  RotateCw,
  Tags,
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
  SessionForm,
  ShowForm,
  ShowList,
} from '@catalog/components/admin';
import { ConfirmCancelSessionDialog } from '@catalog/components/ui';
import {
  useSessionForm,
  useShowForm,
} from '@catalog/hooks/forms';
import { useAdminCatalogMutations } from '@catalog/hooks/mutations';
import { useAdminShowList } from '@catalog/hooks/queries';
import { formatDateTime } from '@catalog/lib';

import type {
  AdminSession,
  AdminShowSummary,
} from '@catalog/server/types';

type ShowPanel =
  | { mode: 'create' }
  | { mode: 'edit'; show: AdminShowSummary }
  | null;

type SessionPanel = {
  showId: string;
  session: AdminSession | null;
} | null;

function CatalogLoadingState() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="space-y-3 rounded-xl border border-border p-5"
        >
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

export function AdminCatalogManager() {
  const query = useAdminShowList();

  const {
    createShowMutation,
    updateShowMutation,
    publishShowMutation,
    unpublishShowMutation,
    deleteShowMutation,
    createSessionMutation,
    updateSessionMutation,
    cancelSessionMutation,
    deleteSessionMutation,
  } = useAdminCatalogMutations();

  const [showPanel, setShowPanel] =
    useState<ShowPanel>(null);

  const [sessionPanel, setSessionPanel] =
    useState<SessionPanel>(null);

  const [cancelTarget, setCancelTarget] =
    useState<AdminSession | null>(null);

  const showForm = useShowForm({
    editing:
      showPanel?.mode === 'edit'
        ? showPanel.show
        : null,
    createShowMutation,
    updateShowMutation,
    onSuccess: () => setShowPanel(null),
  });

  const sessionForm = useSessionForm({
    editing: sessionPanel?.session ?? null,
    showId: sessionPanel?.showId ?? null,
    createSessionMutation,
    updateSessionMutation,
    onSuccess: () => setSessionPanel(null),
  });

  const confirmCancel = () => {
    if (!cancelTarget) return;

    cancelSessionMutation.mutate(
      cancelTarget.id,
      {
        onSuccess: () =>
          setCancelTarget(null),
      },
    );
  };

  const editingSessionTicketsSold =
    sessionPanel?.session?.tickets_sold ?? 0;

  const shows = query.data ?? [];

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
              Espetáculos e sessões
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie o catálogo que alimenta a vitrine do teatro.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            asChild
          >
            <Link href="/admin/generos">
              <Tags />
              Gerenciar gêneros
            </Link>
          </Button>

          <Button
            type="button"
            className="min-h-11 px-4"
            onClick={() =>
              setShowPanel({
                mode: 'create',
              })
            }
          >
            <Plus />
            Novo espetáculo
          </Button>
        </div>
      </div>

      {query.isLoading ? <CatalogLoadingState /> : null}

      {query.isError ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Não foi possível carregar os espetáculos</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Verifique sua conexão e tente novamente.
            </span>

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
        shows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#fae9e9] p-2.5">
              <LogoIcon className="size-full" />
            </span>

            <div className="space-y-1">
              <p className="font-medium">
                Nenhum espetáculo cadastrado ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Crie o primeiro para começar a montar o catálogo.
              </p>
            </div>

            <Button
              type="button"
              className="min-h-11 px-4"
              onClick={() =>
                setShowPanel({
                  mode: 'create',
                })
              }
            >
              <Plus />
              Novo espetáculo
            </Button>
          </div>
        ) : (
          <ShowList
            shows={shows}
            onEditShow={(show) =>
              setShowPanel({
                mode: 'edit',
                show,
              })
            }
            onPublish={(show) =>
              publishShowMutation.mutate(
                show.id,
              )
            }
            onUnpublish={(show) =>
              unpublishShowMutation.mutate(
                show.id,
              )
            }
            onDeleteShow={(show) =>
              deleteShowMutation.mutate(
                show.id,
              )
            }
            onNewSession={(showId) =>
              setSessionPanel({
                showId,
                session: null,
              })
            }
            onEditSession={(
              showId,
              session,
            ) =>
              setSessionPanel({
                showId,
                session,
              })
            }
            onCancelSession={(session) =>
              setCancelTarget(session)
            }
            onDeleteSession={(session) =>
              deleteSessionMutation.mutate(
                session.id,
              )
            }
          />
        )
      ) : null}

      <Dialog
        open={showPanel !== null}
        onOpenChange={(open) => {
          if (!open && !showForm.isPending) setShowPanel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showPanel?.mode === 'edit'
                ? 'Editar espetáculo'
                : 'Novo espetáculo'}
            </DialogTitle>
            <DialogDescription>
              Título, sinopse e categoria aparecem na vitrine assim
              que o espetáculo é publicado.
            </DialogDescription>
          </DialogHeader>

          <ShowForm
            form={showForm.form}
            onSubmit={showForm.handleSubmit}
            onCancel={() => setShowPanel(null)}
            isPending={showForm.isPending}
            mode={showPanel?.mode === 'edit' ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={sessionPanel !== null}
        onOpenChange={(open) => {
          if (!open && !sessionForm.isPending) setSessionPanel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {sessionPanel?.session ? 'Editar sessão' : 'Nova sessão'}
            </DialogTitle>
            <DialogDescription>
              Data, local, capacidade e preço da sessão dentro do
              espetáculo.
            </DialogDescription>
          </DialogHeader>

          <SessionForm
            form={sessionForm.form}
            onSubmit={sessionForm.handleSubmit}
            onCancel={() => setSessionPanel(null)}
            isPending={sessionForm.isPending}
            mode={
              sessionPanel?.session
                ? 'edit'
                : 'create'
            }
            ticketsSold={
              editingSessionTicketsSold
            }
          />
        </DialogContent>
      </Dialog>

      <ConfirmCancelSessionDialog
        open={cancelTarget !== null}
        sessionLabel={
          cancelTarget
            ? `${formatDateTime(
                cancelTarget.starts_at,
              )} · ${cancelTarget.venue}`
            : ''
        }
        ticketsSold={
          cancelTarget?.tickets_sold ?? 0
        }
        isPending={
          cancelSessionMutation.isPending
        }
        onConfirm={confirmCancel}
        onClose={() =>
          setCancelTarget(null)
        }
      />
    </main>
  );
}
