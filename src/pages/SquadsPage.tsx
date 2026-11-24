import { Flag } from 'lucide-react';
import { ExComAndSquadsSection } from '../components/ExComAndSquadsSection';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { usePageTitle } from '../hooks/usePageTitle';
import { PortalDB, PortalUser, SquadName } from '../types';

interface SquadsPageProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  onApply: (role: string, squad?: SquadName) => void;
  onOpenPersonalPortal: () => void;
  onOpenExecutivePortal: () => void;
}

export default function SquadsPage({
  db,
  currentUser,
  onApply,
  onOpenPersonalPortal,
  onOpenExecutivePortal,
}: SquadsPageProps) {
  usePageTitle('Squads – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={Flag}
        title="Squads"
        description="Campus Squads A–E and their weekly operating cadence."
      />
      <ExComAndSquadsSection
        part="squads"
        db={db}
        currentUser={currentUser}
        onApply={onApply}
        onOpenPersonalPortal={onOpenPersonalPortal}
        onOpenExecutivePortal={onOpenExecutivePortal}
      />
      <PrevNext current="/squads" />
    </>
  );
}
