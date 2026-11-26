import { AdminHub, RequireAdmin } from '@catalog';

export default function AdminHubPage() {
  return (
    <RequireAdmin>
      <AdminHub />
    </RequireAdmin>
  );
}
