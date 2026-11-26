import type { z } from 'zod';

import type {
  adminSessionSchema,
  adminShowSchema,
  adminShowSummarySchema,
  sessionFormSchema,
  showFormSchema,
} from '@catalog/schemas';

export type AdminShow = z.infer<typeof adminShowSchema>;
export type AdminShowSummary = z.infer<typeof adminShowSummarySchema>;
export type AdminSession = z.infer<typeof adminSessionSchema>;

export type ShowFormValues = z.infer<typeof showFormSchema>;
export type SessionFormValues = z.infer<typeof sessionFormSchema>;

