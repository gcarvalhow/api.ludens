import type { z } from 'zod';

import type {
  sessionDetailSchema,
  sessionSummarySchema,
  showDetailSchema,
  ticketTypeSchema,
} from '@catalog/schemas';

export type TicketType = z.infer<typeof ticketTypeSchema>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export type ShowDetail = z.infer<typeof showDetailSchema>;
export type SessionDetail = z.infer<typeof sessionDetailSchema>;
