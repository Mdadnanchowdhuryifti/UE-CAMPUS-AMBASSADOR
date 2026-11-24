import { Trophy } from 'lucide-react';
import { LeaderboardSection } from '../components/LeaderboardSection';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { usePageTitle } from '../hooks/usePageTitle';
import { PortalDB } from '../types';

interface LeaderboardPageProps {
  db: PortalDB;
  onOpenSheetSync: () => void;
  onExportCSV: () => void;
}

export default function LeaderboardPage({ db, onOpenSheetSync, onExportCSV }: LeaderboardPageProps) {
  usePageTitle('Leaderboard – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={Trophy}
        title="Leaderboard"
        description="Live KPI leaderboard across all squads and ambassadors."
      />
      <LeaderboardSection db={db} onOpenSheetSync={onOpenSheetSync} onExportCSV={onExportCSV} />
      <PrevNext current="/leaderboard" />
    </>
  );
}
