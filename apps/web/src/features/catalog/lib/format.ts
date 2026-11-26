const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function formatPriceBRL(value: number): string {
  return BRL.format(value);
}

export function formatDateTime(value: Date): string {
  return DATE_TIME.format(value);
}

export function toDateTimeLocalValue(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60_000;

  return new Date(value.getTime() - offsetMs)
    .toISOString()
    .slice(0, 16);
}
