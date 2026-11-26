'use client';

import { TriangleAlert } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@components/ui/alert-dialog';

interface ConfirmCancelSessionDialogProps {
  open: boolean;
  sessionLabel: string;
  ticketsSold: number;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmCancelSessionDialog({
  open,
  sessionLabel,
  ticketsSold,
  isPending,
  onConfirm,
  onClose,
}: ConfirmCancelSessionDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-destructive" />
            Cancelar a sessão?
          </AlertDialogTitle>

          <AlertDialogDescription className="font-medium text-foreground">
            {sessionLabel}
          </AlertDialogDescription>

          <AlertDialogDescription>
            {ticketsSold > 0
              ? `Esta sessão já vendeu ${ticketsSold} ingresso(s). Ao cancelar, os pedidos pagos são cancelados, os ingressos invalidados, os compradores avisados por e-mail e as reservas em aberto liberadas. O reembolso é apenas simulado: nenhum valor real é devolvido. A ação não pode ser desfeita.`
              : 'A sessão sai da vitrine imediatamente. A ação não pode ser desfeita.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            Voltar
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? 'Cancelando...' : 'Cancelar a sessão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
