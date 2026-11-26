import { z } from 'zod';

export const selectionSchema = z
  .object({
    full_quantity: z.number().int().min(0).max(6),
    half_quantity: z.number().int().min(0).max(6),
    idempotency_key: z.string().uuid(),
  })
  .refine(
    (value) =>
      value.full_quantity + value.half_quantity >= 1 &&
      value.full_quantity + value.half_quantity <= 6,
    'Selecione de 1 a 6 ingressos.',
  );

export const reservationSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  show_title: z.string(),
  starts_at: z.string().datetime({ offset: true }),
  venue: z.string(),
  full_quantity: z.number().int().nonnegative(),
  half_quantity: z.number().int().nonnegative(),
  full_price_cents: z.number().int().nonnegative(),
  half_price_cents: z.number().int().nonnegative(),
  total_cents: z.number().int().nonnegative(),
  status: z.enum(['open', 'confirmed', 'expired', 'cancelled']),
  created_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
  server_now: z.string().datetime({ offset: true }),
});

export const reservationPageSchema = z.object({
  items: z.array(reservationSchema),
  page: z.number().int(),
  size: z.number().int(),
  total: z.number().int(),
});

export const rebookingOptionsSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string().uuid(),
      starts_at: z.string().datetime({ offset: true }),
      venue: z.string(),
      available_count: z.number().int().nonnegative(),
    }),
  ),
  server_now: z.string().datetime({ offset: true }),
});
