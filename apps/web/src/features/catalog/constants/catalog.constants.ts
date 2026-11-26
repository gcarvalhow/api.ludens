import type {
  AdminSession,
  AdminShow,
} from '@catalog/server/types';

export const SHOW_STATUS_LABELS: Record<
  AdminShow['status'],
  string
> = {
  draft: 'Rascunho',
  published: 'Publicado',
};

export const SESSION_STATUS_LABELS: Record<
  AdminSession['status'],
  string
> = {
  on_sale: 'À venda',
  closed: 'Encerrada',
  cancelled: 'Cancelada',
};

// Variant do <Badge /> (shadcn/ui) por status — mantém a cor do
// selo consistente em toda a área admin, em vez de repetir classes
// soltas em cada componente.
export const SHOW_STATUS_BADGE_VARIANT: Record<
  AdminShow['status'],
  'warning' | 'success'
> = {
  draft: 'warning',
  published: 'success',
};

export const SESSION_STATUS_BADGE_VARIANT: Record<
  AdminSession['status'],
  'success' | 'secondary' | 'destructive'
> = {
  on_sale: 'success',
  closed: 'secondary',
  cancelled: 'destructive',
};
