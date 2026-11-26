'use client';

import { useEffect, useState } from 'react';
import { selectionSchema } from '@booking/schemas/reservation.schema';
import type { TicketSelection } from '@booking/server/types/reservation.types';

export function useTicketSelection(sessionId: string) {
  const [selection, setSelection] = useState<TicketSelection | null>(null);
  const storageKey = `ludens:booking:draft:${sessionId}`;

  useEffect(() => {
    let saved: TicketSelection | null = null;
    try {
      const parsed = selectionSchema.safeParse(
        JSON.parse(localStorage.getItem(storageKey) ?? 'null'),
      );
      if (parsed.success) saved = parsed.data;
    } catch {
      /* Storage may be disabled; the in-memory selection remains usable. */
    }
    setSelection(
      saved ?? { full_quantity: 1, half_quantity: 0, idempotency_key: crypto.randomUUID() },
    );
  }, [storageKey]);

  const persist = (value: TicketSelection) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* Private browser storage. */
    }
  };

  const update = (field: 'full_quantity' | 'half_quantity', quantity: number) => {
    if (!selection || !Number.isInteger(quantity) || quantity < 0 || quantity > 6) return;
    const next = { ...selection, [field]: quantity, idempotency_key: crypto.randomUUID() };
    setSelection(next);
    persist(next);
  };

  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* Storage may be disabled. */
    }
    setSelection({ full_quantity: 1, half_quantity: 0, idempotency_key: crypto.randomUUID() });
  };

  return { selection, update, persist, clear };
}
