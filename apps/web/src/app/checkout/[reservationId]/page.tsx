import { CheckoutFlow } from '@booking/components/CheckoutFlow';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  return <CheckoutFlow reservationId={reservationId} />;
}
