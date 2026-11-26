import { PurchaseHistory } from '@booking/components/PurchaseHistory';

export default async function PurchaseDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <PurchaseHistory mode="orders" orderId={orderId} />;
}
