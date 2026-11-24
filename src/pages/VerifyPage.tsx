import { BadgeCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { WorkshopsAndVerifySection } from '../components/WorkshopsAndVerifySection';
import { usePageTitle } from '../hooks/usePageTitle';
import { CertificateRecord, PortalDB, PortalUser, Workshop } from '../types';

interface VerifyPageProps {
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

export default function VerifyPage(props: VerifyPageProps) {
  usePageTitle('Verify Credentials & Clubs – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={BadgeCheck}
        title="Verify Credentials & Clubs"
        description="Check certificates and pitch your club for a collaboration."
      />
      <WorkshopsAndVerifySection part="verify" {...props} />
      <PrevNext current="/verify" />
    </>
  );
}
