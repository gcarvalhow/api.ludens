import { z } from 'zod';

export const showCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  synopsis_short: z.string(),
  image_url: z.string(),
  genre_id: z.string().uuid(),
  genre: z.string(),
  upcoming_dates: z.array(z.coerce.date()),
  price_min: z.number(),
  price_max: z.number(),
});

export const pagedShowsSchema = z.object({
  items: z.array(showCardSchema),
  page: z.number().int(),
  size: z.number().int(),
  total: z.number().int(),
});

// GET /catalog/genres devolve [{ id, name }] — contrato real
// (app/modules/catalog/application/schemas/response.py, GenreResponse).
// Filtro usa o id (UUID); name é o texto exibido.
export const genreSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const genreListSchema = z.array(genreSchema);

export const genreFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Informe o nome')
    .max(80),
});
