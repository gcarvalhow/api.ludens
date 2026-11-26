import {
  AdminGenreManager,
  RequireAdmin,
} from '@catalog';

export default function AdminGenresPage() {
  return (
    <RequireAdmin>
      <AdminGenreManager />
    </RequireAdmin>
  );
}
