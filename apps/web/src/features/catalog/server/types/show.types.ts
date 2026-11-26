import type { z } from 'zod';

import type {
  genreFormSchema,
  genreListSchema,
  genreSchema,
  pagedShowsSchema,
  showCardSchema,
} from '@catalog/schemas';

export type ShowCardModel = z.infer<typeof showCardSchema>;
export type PagedShows = z.infer<typeof pagedShowsSchema>;
export type Genre = z.infer<typeof genreSchema>;
export type GenreList = z.infer<typeof genreListSchema>;
export type GenreFormValues = z.infer<typeof genreFormSchema>;
