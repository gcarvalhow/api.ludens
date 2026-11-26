import { RequireAdmin } from '@catalog';
import { AdminOrders } from '@booking/components/AdminOrders';

export default function AdminOrdersPage() {
  return (
    <RequireAdmin>
      <AdminOrders />
    </RequireAdmin>
  );
}
