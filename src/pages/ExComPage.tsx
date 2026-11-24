import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { ExComAndSquadsSection } from '../components/ExComAndSquadsSection';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { usePageTitle } from '../hooks/usePageTitle';
import { PortalDB, PortalUser, SquadName } from '../types';

interface ExComPageProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  onApply: (role: string, squad?: SquadName) => void;
  onOpenPersonalPortal: () => void;
  onOpenExecutivePortal: () => void;
}

export default function ExComPage({
  db,
  currentUser,
  onApply,
  onOpenPersonalPortal,
  onOpenExecutivePortal,
}: ExComPageProps) {
  usePageTitle('ExCom – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={Users}
        title="ExCom"
        description="Program leadership and role-locked portals for the Executive Committee."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/architecture"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B51B27] hover:underline focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2 rounded"
        >
          <span>Tier 1 · Program Chair — see Architecture</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
      <ExComAndSquadsSection
        part="excom"
        db={db}
        currentUser={currentUser}
        onApply={onApply}
        onOpenPersonalPortal={onOpenPersonalPortal}
        onOpenExecutivePortal={onOpenExecutivePortal}
      />
      <PrevNext current="/excom" />
    </>
  );
}
