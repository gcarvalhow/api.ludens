export type Reservation = {
  id: string;
  session_id: string;
  show_title: string;
  starts_at: string;
  venue: string;
  full_quantity: number;
  half_quantity: number;
  full_price_cents: number;
  half_price_cents: number;
  total_cents: number;
  status: 'open' | 'confirmed' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string;
  server_now: string;
};

export type Ticket = {
  id: string;
  ticket_type: 'full' | 'half';
  price_cents: number;
  code: string;
  status: 'valid' | 'used' | 'cancelled';
  checked_in_at?: string | null;
  is_demonstration: true;
};

export type PurchaseOrder = {
  id: string;
  reservation_id: string;
  session_id: string;
  show_title: string;
  session_starts_at: string;
  venue: string;
  full_quantity: number;
  half_quantity: number;
  full_price_cents: number;
  half_price_cents: number;
  amount_cents: number;
  status: 'pending' | 'paid' | 'declined' | 'expired' | 'cancelled';
  expires_at: string;
  resolved_at: string | null;
  cancelled_at?: string | null;
  cancel_origin?: 'buyer' | 'session' | null;
  cancel_reason?: string | null;
  refund_percent?: number | null;
  refund_cents?: number | null;
  is_refund_simulated?: true;
  tickets: Ticket[];
  is_demonstration: true;
};

export type CancellationPreview = {
  order_id: string;
  can_cancel: boolean;
  order_status: PurchaseOrder['status'];
  ticket_count: number;
  refund_percent: number | null;
  refund_cents: number | null;
  message: string;
  is_refund_simulated: true;
};

export type AdminOrder = PurchaseOrder & { buyer_name: string; buyer_email: string };

export type AdminOrderPage = { items: AdminOrder[]; total: number; page: number; size: number };

export type CheckInResult = {
  code: string;
  ticket_type: 'full' | 'half';
  status: 'used';
  checked_in_at: string;
  show_title: string;
  session_starts_at: string;
  venue: string;
};
