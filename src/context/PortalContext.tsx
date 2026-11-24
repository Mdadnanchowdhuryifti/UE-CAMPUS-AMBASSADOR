import { createContext, useContext } from 'react';
import {
  Ambassador,
  AuthSignInMode,
  CertificateRecord,
  PortalDB,
  PortalUser,
  SquadName,
  SystemConfig,
  Workshop,
} from '../types';

export interface PortalContextValue {
  portalData: PortalDB;
  currentUser: PortalUser | null;
  authLoading: boolean;
  signingIn: boolean;
  authError: string | null;
  systemConfig: SystemConfig;
  readOnlyLockdown: boolean;
  detectedRefCode: string;
  referringCA: Ambassador | undefined;
  theme: 'light' | 'dark';
  setTheme: (next: 'light' | 'dark') => void;
  clearAuthError: () => void;
  onApply: (role: string, squad?: SquadName) => void;
  onGoogleSignIn: (intent?: AuthSignInMode, emailHint?: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenDashboard: () => void;
  onOpenSheetSync: () => void;
  onExportCSV: () => void;
  onSelectWorkshop: (ws: Workshop) => void;
  onVerifyCertificate: (id: string) => Promise<CertificateRecord | null>;
  onSubmitClubPitch: (pitch: {
    club: string;
    university: string;
    contact: string;
    type: string;
  }) => Promise<void>;
  onOpenGuide: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export const PortalProvider = PortalContext.Provider;

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return ctx;
}
