import { Network } from 'lucide-react';
import { GovernanceSection } from '../components/GovernanceSection';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { usePageTitle } from '../hooks/usePageTitle';
import { PortalDB, SquadName } from '../types';

interface ArchitecturePageProps {
  db: PortalDB;
  onApply: (role: string, squad?: SquadName) => void;
}

export default function ArchitecturePage({ db, onApply }: ArchitecturePageProps) {
  usePageTitle('Architecture – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={Network}
        title="Architecture"
        description="The 4-tier governance structure behind the Campus Ambassador Program."
      />
      <GovernanceSection recruitmentStatus={db.recruitmentStatus} onApply={onApply} />
      <PrevNext current="/architecture" />
    </>
  );
}
