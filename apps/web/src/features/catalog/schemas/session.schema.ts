import { z } from 'zod';

export const ticketTypeSchema = z.object({
  type: z.enum(['full', 'half']),
  price: z.number(),
});

export const publicSessionStatusEnum = z.enum(['on_sale', 'sold_out', 'closed', 'cancelled']);

export const sessionSummarySchema = z.object({
  id: z.string().uuid(),
  starts_at: z.coerce.date(),
  venue: z.string(),
  capacity: z.number().int().nonnegative(),
  available_count: z.number().int().nonnegative(),
  status: publicSessionStatusEnum,
});

export const showDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  synopsis: z.string(),
  image_url: z.string(),
  genre: z.string(),
  sessions: z.array(sessionSummarySchema),
});

export const sessionDetailSchema = z.object({
  id: z.string().uuid(),
  show: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
  starts_at: z.coerce.date(),
  venue: z.string(),
  capacity: z.number().int(),
  available_count: z.number().int(),
  status: publicSessionStatusEnum,
  ticket_types: z.array(ticketTypeSchema),
});
