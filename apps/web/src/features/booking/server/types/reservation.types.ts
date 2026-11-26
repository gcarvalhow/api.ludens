import type { z } from 'zod';
import type { reservationSchema, selectionSchema } from '@booking/schemas/reservation.schema';

export type Reservation = z.infer<typeof reservationSchema>;
export type TicketSelection = z.infer<typeof selectionSchema>;
export type ReservationRequest = TicketSelection & { session_id: string };
