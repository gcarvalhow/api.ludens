import { fetcher } from '@web/lib/fetcher';
import { endpoints } from '@web/routes/endpoints';

import type {
  AdminSession,
  AdminShow,
  AdminShowSummary,
  Genre,
  GenreFormValues,
  GenreList,
  PagedShows,
  SessionDetail,
  SessionFormValues,
  ShowCardModel,
  ShowDetail,
  ShowFormValues,
} from '@catalog/server/types';

export type ShowFilterParams = {
  fromDate?: string;
  genre?: string;
  page?: number;
  size?: number;
};

function buildQuery(filters: ShowFilterParams): string {
  const params = new URLSearchParams();

  if (filters.fromDate) {
    // Contrato real é snake_case (from_date) — GET /catalog/shows, show_router.py.
    // `fromDate` (camelCase) é só o nome interno do filtro no frontend/URL.
    params.set('from_date', filters.fromDate);
  }

  if (filters.genre) {
    // Contrato real é genre_id (UUID) — GET /catalog/shows, show_router.py.
    params.set('genre_id', filters.genre);
  }

  params.set('page', String(filters.page ?? 1));
  params.set('size', String(filters.size ?? 12));

  return params.toString();
}

// O <input type="datetime-local"> devolve hora local sem fuso;
// o backend exige ISO 8601 com offset. show_id vai no corpo (SessionRequest)
// — não existe mais rota aninhada /shows/{id}/sessions.
function toSessionPayload(
  showId: string,
  values: SessionFormValues,
) {
  return {
    show_id: showId,
    starts_at: new Date(
      values.starts_at,
    ).toISOString(),
    venue: values.venue,
    capacity: values.capacity,
    full_price: values.full_price,
  };
}

// O fetcher não valida a resposta em runtime (contrato da feature —
// ver issue #11), então o JSON chega com `starts_at` como string ISO
// mesmo o tipo dizendo `Date` (via z.coerce.date()). Revive só esse
// campo, sem pagar o custo de um `.parse()` completo do schema.
function reviveSession(session: AdminSession): AdminSession {
  return {
    ...session,
    starts_at: new Date(session.starts_at),
  };
}

function reviveShow(show: AdminShow): AdminShow {
  return {
    ...show,
    sessions: show.sessions.map(reviveSession),
  };
}

// Mesmo motivo do reviveSession/reviveShow: o fetcher não valida em
// runtime, então upcoming_dates chega como string[] apesar do tipo
// dizer Date[] (via z.coerce.date()).
function reviveShowCard(show: ShowCardModel): ShowCardModel {
  return {
    ...show,
    upcoming_dates: show.upcoming_dates.map((date) => new Date(date)),
  };
}

export const catalogService = {
  async fetchShows(filters: ShowFilterParams = {}) {
    const page = await fetcher<PagedShows>(
      `${endpoints.catalog.shows}?${buildQuery(filters)}`,
      {
        method: 'GET',
        skipAuth: true,
      },
    );

    return {
      ...page,
      items: page.items.map(reviveShowCard),
    };
  },

  fetchGenres() {
    return fetcher<GenreList>(
      endpoints.catalog.genres,
      {
        method: 'GET',
        skipAuth: true,
      },
    );
  },

  createGenre(values: GenreFormValues) {
    return fetcher<Genre>(
      endpoints.catalog.genres,
      {
        method: 'POST',
        body: JSON.stringify(values),
      },
    );
  },

  updateGenre(id: string, values: GenreFormValues) {
    return fetcher<Genre>(
      endpoints.catalog.genreById(id),
      {
        method: 'PUT',
        body: JSON.stringify(values),
      },
    );
  },

  deleteGenre(id: string) {
    return fetcher<void>(
      endpoints.catalog.genreById(id),
      {
        method: 'DELETE',
      },
    );
  },

  async fetchShowById(id: string) {
  const show = await fetcher<ShowDetail>(
    endpoints.catalog.showById(id),
    {
      method: 'GET',
      skipAuth: true,
    },
  );

  return {
    ...show,
    sessions: show.sessions.map((session) => ({
      ...session,
      starts_at: new Date(session.starts_at),
    })),
  };
},

async fetchSessionById(id: string) {
  const session = await fetcher<SessionDetail>(
    endpoints.catalog.sessionById(id),
    {
      method: 'GET',
      skipAuth: true,
    },
  );

  return {
    ...session,
    starts_at: new Date(session.starts_at),
  };
},

  // GET /catalog/shows — mesma busca pública, mas o backend devolve
  // Page<AdminShowSummaryResponse> (resumo, sem sessions) quando o
  // token é de admin. Sem paginação na UI ainda, então busca no
  // tamanho máximo permitido pelo endpoint (48).
  async listAdminShows() {
    const page = await fetcher<{
      items: AdminShowSummary[];
    }>(`${endpoints.catalog.shows}?size=48`, {
      method: 'GET',
    });

    return page.items;
  },

  // GET /catalog/shows/{id} — mesmo endpoint da vitrine pública; com
  // token de admin devolve o detalhe completo, com sessions (todas —
  // passadas, canceladas e futuras, sem filtro).
  async getAdminShow(id: string) {
    const show = await fetcher<AdminShow>(
      endpoints.catalog.showById(id),
      {
        method: 'GET',
      },
    );

    return reviveShow(show);
  },

  async createShow(values: ShowFormValues) {
    const show = await fetcher<AdminShow>(
      endpoints.catalog.shows,
      {
        method: 'POST',
        body: JSON.stringify(values),
      },
    );

    return reviveShow(show);
  },

  async updateShow(
    id: string,
    values: ShowFormValues,
  ) {
    const show = await fetcher<AdminShow>(
      endpoints.catalog.showById(id),
      {
        method: 'PUT',
        body: JSON.stringify(values),
      },
    );

    return reviveShow(show);
  },

  publishShow(id: string) {
    return fetcher<void>(
      endpoints.catalog.showPublish(id),
      {
        method: 'POST',
      },
    );
  },

  unpublishShow(id: string) {
    return fetcher<void>(
      endpoints.catalog.showUnpublish(id),
      {
        method: 'POST',
      },
    );
  },

  deleteShow(id: string) {
    return fetcher<void>(
      endpoints.catalog.showById(id),
      {
        method: 'DELETE',
      },
    );
  },

  async createSession(
    showId: string,
    values: SessionFormValues,
  ) {
    const session = await fetcher<AdminSession>(
      endpoints.catalog.sessions,
      {
        method: 'POST',
        body: JSON.stringify(
          toSessionPayload(showId, values),
        ),
      },
    );

    return reviveSession(session);
  },

  // PUT /catalog/sessions/{id} exige show_id no corpo mesmo em edição
  // (o backend ignora o valor, mas o campo é obrigatório) — por isso
  // recebe showId aqui também.
  async updateSession(
    sessionId: string,
    showId: string,
    values: SessionFormValues,
  ) {
    const session = await fetcher<AdminSession>(
      endpoints.catalog.sessionById(sessionId),
      {
        method: 'PUT',
        body: JSON.stringify(
          toSessionPayload(showId, values),
        ),
      },
    );

    return reviveSession(session);
  },

  cancelSession(sessionId: string) {
    return fetcher<void>(
      endpoints.catalog.sessionCancel(
        sessionId,
      ),
      {
        method: 'POST',
      },
    );
  },

  deleteSession(sessionId: string) {
    return fetcher<void>(
      endpoints.catalog.sessionById(
        sessionId,
      ),
      {
        method: 'DELETE',
      },
    );
  },
};