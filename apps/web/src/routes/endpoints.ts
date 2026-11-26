const API_BASE = '/api';
const IDENTITY_BASE = `${API_BASE}/identity`;
// api.ludens (#56) moveu auth_router pra baixo de /identity/authentication
// pra não colidir com o prefixo de user_router (/identity/users).
const AUTH_BASE = `${IDENTITY_BASE}/authentication`;
const CATALOG_BASE = `${API_BASE}/catalog`;
const BOOKING_BASE = `${API_BASE}/booking`;

export const endpoints = {
  auth: {
    login: `${AUTH_BASE}/login`,
    refresh: `${AUTH_BASE}/refresh`,
    logout: `${AUTH_BASE}/logout`,
    changePassword: `${AUTH_BASE}/password/change`,
    passwordForgot: `${AUTH_BASE}/password/forgot`,
    passwordReset: `${AUTH_BASE}/password/reset`,
  },

  users: {
    register: `${IDENTITY_BASE}/users`,
    profile: `${IDENTITY_BASE}/users`,
    emailChange: `${IDENTITY_BASE}/users/email/change`,
    deletion: `${IDENTITY_BASE}/users/deletion`,
    list: `${IDENTITY_BASE}/users`,
    byId: (id: string) => `${IDENTITY_BASE}/users/${id}`,
  },

  // api.ludens unificou leitura admin/pública (#45/#47): não existe mais
  // um namespace /admin separado — é a mesma URL pra público e admin,
  // o backend decide o formato da resposta pelo token do usuário.
  catalog: {
    // show_router (#56) trocou de rotas inline "/shows/" pra prefix
    // "/catalog/shows" + path "" — a listagem/criação perdeu a barra final.
    shows: `${CATALOG_BASE}/shows`,
    showById: (id: string) => `${CATALOG_BASE}/shows/${id}`,
    showPublish: (id: string) =>
      `${CATALOG_BASE}/shows/${id}/publish`,
    showUnpublish: (id: string) =>
      `${CATALOG_BASE}/shows/${id}/unpublish`,
    genres: `${CATALOG_BASE}/genres`,
    genreById: (id: string) => `${CATALOG_BASE}/genres/${id}`,
    sessions: `${CATALOG_BASE}/sessions/`,
    sessionById: (id: string) => `${CATALOG_BASE}/sessions/${id}`,
    sessionCancel: (id: string) =>
      `${CATALOG_BASE}/sessions/${id}/cancel`,
  },

  booking: {
    reservations: `${BOOKING_BASE}/reservations`,
    reservationById: (id: string) => `${BOOKING_BASE}/reservations/${id}`,
    reservationCancel: (id: string) => `${BOOKING_BASE}/reservations/${id}/cancel`,
    rebookingOptions: (id: string) => `${BOOKING_BASE}/reservations/${id}/rebooking-options`,
    reservation: (id: string) => `${BOOKING_BASE}/reservations/${id}`,
    checkout: (reservationId: string) => `${BOOKING_BASE}/reservations/${reservationId}/checkout`,
    orders: `${BOOKING_BASE}/orders`,
    order: (id: string) => `${BOOKING_BASE}/orders/${id}`,
    simulatePayment: (id: string) => `${BOOKING_BASE}/orders/${id}/simulate`,
    cancellationPreview: (id: string) => `${BOOKING_BASE}/orders/${id}/cancellation-preview`,
    cancelOrder: (id: string) => `${BOOKING_BASE}/orders/${id}/cancel`,
    adminOrders: `${BOOKING_BASE}/admin/orders`,
    checkIn: `${BOOKING_BASE}/tickets/check-in`,
  },
} as const;
