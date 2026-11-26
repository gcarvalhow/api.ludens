import { ShowSessions } from '@catalog/components';

interface ShowPageProps {
  params: Promise<{
    showId: string;
  }>;
}

export default async function ShowPage({
  params,
}: ShowPageProps) {
  const { showId } = await params;

  return <ShowSessions showId={showId} />;
}
