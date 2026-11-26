import { z } from 'zod';

export const showStatusEnum = z.enum([
  'draft',
  'published',
]);

export const sessionStatusEnum = z.enum([
  'on_sale',
  'closed',
  'cancelled',
]);

export const adminSessionSchema = z.object({
  id: z.string().uuid(),
  show_id: z.string().uuid(),
  starts_at: z.coerce.date(),
  venue: z.string(),
  capacity: z.number().int(),
  full_price: z.number(),
  half_price: z.number(),
  status: sessionStatusEnum,
  tickets_sold: z.number().int(),
  reserved_open: z.number().int(),
  can_delete: z.boolean(),
});

export const adminShowSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  synopsis: z.string(),
  image_url: z.string(),
  genre_id: z.string().uuid(),
  genre: z.string(),
  status: showStatusEnum,
});

// GET /catalog/shows/{id} (com token admin), POST e PUT — detalhe
// completo, com sessions. GET /catalog/shows (lista/busca, mesmo
// endpoint do público) devolve só o resumo acima, sem sessions —
// ver api.ludens#45/#47 (unificação admin/público).
export const adminShowSchema = adminShowSummarySchema.extend({
  sessions: z.array(adminSessionSchema),
});

export const adminShowSummaryListSchema =
  z.array(adminShowSummarySchema);

export const showFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Informe o título')
    .max(200),

  synopsis: z
    .string()
    .min(1, 'Informe a sinopse')
    .max(5000),

  genre_id: z
    .string()
    .uuid('Selecione um gênero'),
});

export const sessionFormSchema = z.object({
  starts_at: z
    .string()
    .min(1, 'Informe a data e a hora')
    .refine(
      (v) => !Number.isNaN(Date.parse(v)),
      'Data inválida',
    )
    .refine(
      (v) =>
        new Date(v).getTime() > Date.now(),
      'A data da sessão deve ser futura',
    ),

  venue: z
    .string()
    .min(1, 'Informe o local')
    .max(200),

  capacity: z
    .number({
      invalid_type_error:
        'Informe a capacidade',
    })
    .int(
      'A capacidade deve ser um número inteiro',
    )
    .positive(
      'A capacidade deve ser maior que zero',
    )
    .max(100_000),

    full_price: z
    .number({
      invalid_type_error:
        'Informe o preço da inteira',
    })
    .positive(
      'O preço deve ser maior que zero',
    ),
});