import {
  AdminCatalogManager,
  RequireAdmin,
} from '@catalog';

export default function AdminShowsPage() {
  return (
    <RequireAdmin>
      <AdminCatalogManager />
    </RequireAdmin>
  );
}
