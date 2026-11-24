import { GraduationCap } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { WorkshopsAndVerifySection } from '../components/WorkshopsAndVerifySection';
import { usePageTitle } from '../hooks/usePageTitle';
import { CertificateRecord, PortalDB, PortalUser, Workshop } from '../types';

interface WorkshopsPageProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  readOnlyLockdown: boolean;
  onRequireSignIn: () => Promise<void>;
  onSelectWorkshop: (ws: Workshop) => void;
  onVerifyCertificate: (id: string) => Promise<CertificateRecord | null>;
  onSubmitClubPitch: (pitch: {
    club: string;
    university: string;
    contact: string;
    type: string;
  }) => Promise<void>;
}

export default function WorkshopsPage(props: WorkshopsPageProps) {
  usePageTitle('Workshops – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Workshops"
        description="Upcoming workshops — register with your ambassador referral code."
      />
      <WorkshopsAndVerifySection part="workshops" {...props} />
      <PrevNext current="/workshops" />
    </>
  );
}
