import { fetcher } from '@web/lib/fetcher';
import { endpoints } from '@web/routes/endpoints';
import {
  rebookingOptionsSchema,
  reservationPageSchema,
  reservationSchema,
} from '@booking/schemas/reservation.schema';
import type { ReservationRequest } from '@booking/server/types/reservation.types';

export const reservationService = {
  async create(request: ReservationRequest) {
    return reservationSchema.parse(
      await fetcher(endpoints.booking.reservations, {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    );
  },
  async list(page: number) {
    return reservationPageSchema.parse(
      await fetcher(`${endpoints.booking.reservations}?page=${page}&size=12`, {
        cache: 'no-store',
      }),
    );
  },
  async get(id: string) {
    return reservationSchema.parse(
      await fetcher(endpoints.booking.reservationById(id), { cache: 'no-store' }),
    );
  },
  async cancel(id: string) {
    return reservationSchema.parse(
      await fetcher(endpoints.booking.reservationCancel(id), { method: 'POST' }),
    );
  },
  async rebookingOptions(id: string) {
    return rebookingOptionsSchema.parse(
      await fetcher(endpoints.booking.rebookingOptions(id), { cache: 'no-store' }),
    );
  },
};
