import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { BookOpen, Moon, Sun } from 'lucide-react';
import {
  auth,
  db as firestore,
  googleProvider,
  handleFirestoreError,
  isMainDeveloperEmail,
  normalizeEmailKey,
  OperationType,
  registerFirestoreErrorObserver,
} from './lib/firebase';
import {
  DEFAULT_SYSTEM_CONFIG,
  fetchUserModerationStatus,
  logSystemError,
  revokeUserRoleWithAudit,
  timestampToDate,
  writeAdminAuditLog,
} from './services/adminService';
import {
  addOrUpdateAmbassador,
  approveApplicationAndOnboard,
  createWorkshopDoc,
  deleteCampaignKitDoc,
  fetchRoleAssignmentForEmail,
  getFirstOpenRecruitmentRoleTitle,
  hasAnyOpenRecruitmentRole,
  isFullAccessRole,
  isRoleOpenForRecruitment,
  issueCertificateDoc,
  LEAD_TO_SQUAD,
  normalizeRecruitmentStatus,
  publishCampaignKitDoc,
  rejectApplicationDoc,
  removeRoleAssignment,
  reviewSubmissionAtomic,
  saveProgramSettings,
  seedInitialFirestoreData,
  submitApplicationDoc,
  submitCAProofDoc,
  submitClubPitchDoc,
  submitWorkshopRegistrationDoc,
  syncRosterBatchToFirestore,
  toggleCertificateStatusDoc,
  updateClubPitchStatusDoc,
  updateRecruitmentStatusDoc,
  updateTechLeadStageDoc,
  upsertRoleAssignment,
  validateGoogleSheetsCsvUrl,
  verifyCertificateById,
} from './services/portalService';
import { calcPoints, DEFAULT_DB, SQUADS_META } from './data/playbook';
import {
  ActivitySubmission,
  AdminAuditAction,
  AdminAuditLog,
  Ambassador,
  AuthSignInMode,
  BlockedSessionNotice,
  CampaignKit,
  CertificateRecord,
  ClubPitch,
  ClubPitchStatus,
  KpiWeights,
  LeadRole,
  PortalDB,
  PortalUser,
  RecruitmentApplication,
  RecruitmentStatusMap,
  RoleAssignment,
  SquadName,
  SubmissionType,
  SystemConfig,
  SystemErrorLog,
  SystemErrorSeverity,
  SystemErrorSource,
  TechLeadTicket,
  TechPipelineStage,
  UserModerationRecord,
  UserModerationStatus,
  UserRole,
  Workshop,
  WorkshopRegistration,
} from './types';
import { Header } from './components/Header';
import { RoleDashboard } from './components/RoleDashboard';
import { MobileBottomNav } from './components/AppNavigation';
import { PageSkeleton } from './components/PageSkeleton';
import { ScrollToTop } from './components/ScrollToTop';

// Pages are lazy-loaded so each route ships as its own chunk.
const HomePage = lazy(() => import('./pages/HomePage'));
const ArchitecturePage = lazy(() => import('./pages/ArchitecturePage'));
const ExComPage = lazy(() => import('./pages/ExComPage'));
const SquadsPage = lazy(() => import('./pages/SquadsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const WorkshopsPage = lazy(() => import('./pages/WorkshopsPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminPage = lazy(() =>
  import('./components/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const ProfilePage = lazy(() =>
  import('./components/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const MembersPage = lazy(() =>
  import('./components/MembersPage').then((m) => ({ default: m.MembersPage }))
);
import {
  AccountBlockedModal,
  MaintenanceScreen,
  SystemStatusBanner,
} from './components/MaintenanceScreen';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import {
  ApplyModal,
  AuthModal,
  PlaybookGuideDrawer,
  SheetSyncModal,
  WorkshopModal,
} from './components/PortalModals';

export default function App() {
  const [portalData, setPortalData] = useState<PortalDB>({
    ...DEFAULT_DB,
    submissions: [],
    applications: [],
    clubPitches: [],
    techPipeline: [],
    campaignKits: [],
    workshopRegistrations: [],
    roleAssignments: [],
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('ue_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [detectedRefCode, setDetectedRefCode] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthSignInMode>('standard');
  const [authError, setAuthError] = useState<string | null>(null);
  const [applyModalState, setApplyModalState] = useState<{
    open: boolean;
    role: string;
    squad: SquadName;
  }>({ open: false, role: 'General Campus Ambassador', squad: 'Squad A' });
  const [activeWorkshop, setActiveWorkshop] = useState<Workshop | null>(null);
  const [sheetSyncOpen, setSheetSyncOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const systemConfigRef = useRef<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const currentUserRef = useRef<PortalUser | null>(null);

  const [userModerations, setUserModerations] = useState<UserModerationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>([]);
  const [blockedNotice, setBlockedNotice] = useState<BlockedSessionNotice | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute =
    location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  const navigateTo = (nextPath: string) => {
    navigate(nextPath);
  };

  useEffect(() => {
    systemConfigRef.current = systemConfig;
  }, [systemConfig]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Global Firestore & runtime error reporting -> Firestore error_logs
  useEffect(() => {
    registerFirestoreErrorObserver((info) => {
      const isDev = currentUserRef.current?.role === 'developer';
      void logSystemError({
        source: 'firestore',
        severity: 'error',
        message: info.error,
        path: info.path || window.location.pathname || '/',
        operation: info.operationType,
        skipIfLockdown: systemConfigRef.current.emergencyLockdown && !isDev,
      });
    });

    const handleWindowError = (event: ErrorEvent) => {
      const isDev = currentUserRef.current?.role === 'developer';
      void logSystemError({
        source: 'runtime',
        severity: 'error',
        message: event.message || 'Unhandled runtime error',
        path: window.location.pathname || '/',
        operation: 'window.onerror',
        skipIfLockdown: systemConfigRef.current.emergencyLockdown && !isDev,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const isDev = currentUserRef.current?.role === 'developer';
      const reasonMsg =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === 'string'
          ? event.reason
          : 'Unhandled promise rejection';
      // Avoid double-logging structured FirestoreErrorInfo already captured by observer
      if (reasonMsg.startsWith('{"error":') && reasonMsg.includes('"operationType"')) return;
      void logSystemError({
        source: 'unhandled_rejection',
        severity: 'error',
        message: reasonMsg,
        path: window.location.pathname || '/',
        operation: 'promise',
        skipIfLockdown: systemConfigRef.current.emergencyLockdown && !isDev,
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      registerFirestoreErrorObserver(null);
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // Sync theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    try {
      localStorage.setItem('ue_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Detect ?ref=CODE on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.trim()) {
      setDetectedRefCode(ref.trim().toUpperCase());
    }
  }, []);

  // 1. Public Firestore Listeners (Zero-PII collections: config/system, settings, ambassadors, workshops)
  useEffect(() => {
    const unsubSystemConfig = onSnapshot(
      doc(firestore, 'config', 'system'),
      (snap) => {
        if (!snap.exists()) {
          setSystemConfig(DEFAULT_SYSTEM_CONFIG);
          return;
        }
        const d = snap.data();
        setSystemConfig({
          maintenanceMode: Boolean(d.maintenanceMode),
          maintenanceMessage: String(
            d.maintenanceMessage || DEFAULT_SYSTEM_CONFIG.maintenanceMessage
          ),
          emergencyLockdown: Boolean(d.emergencyLockdown),
          lockdownMessage: String(
            d.lockdownMessage || DEFAULT_SYSTEM_CONFIG.lockdownMessage
          ),
          lockdownEpoch: Number(d.lockdownEpoch || 0),
          updatedByName: String(d.updatedByName || 'Platform Developer'),
          updatedByUid: String(d.updatedByUid || 'system'),
          updatedAt: timestampToDate(d.updatedAt),
        });
      },
      (err) => {
        console.warn('System config snapshot notice:', err.message);
      }
    );
    const unsubSettings = onSnapshot(
      doc(firestore, 'settings', 'program'),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setPortalData((prev) => ({
          ...prev,
          kpiWeights: {
            workshopReg: Number(d.workshopReg ?? 15),
            techLead: Number(d.techLead ?? 40),
            brandPost: Number(d.brandPost ?? 5),
            clubEvent: Number(d.clubEvent ?? 30),
            certThreshold: Number(d.certThreshold ?? 120),
          },
          chairName: String(d.chairName || DEFAULT_DB.chairName),
          ceoName: String(d.ceoName || DEFAULT_DB.ceoName),
          secretaryName: String(d.secretaryName || DEFAULT_DB.secretaryName),
          recruitmentStatus: normalizeRecruitmentStatus(d.recruitmentStatus),
        }));
      },
      (err) => {
        console.warn('Settings snapshot notice:', err.message);
      }
    );

    const unsubAmbassadors = onSnapshot(
      collection(firestore, 'ambassadors'),
      (snap) => {
        if (snap.empty) return;
        const list: Ambassador[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            name: String(v.name || ''),
            campus: String(v.campus || ''),
            squad: (v.squad || 'Squad A') as SquadName,
            code: String(v.code || ''),
            workshopRegs: Number(v.workshopRegs || 0),
            techLeads: Number(v.techLeads || 0),
            brandPosts: Number(v.brandPosts || 0),
            clubEvents: Number(v.clubEvents || 0),
            status: v.status === 'Inactive' ? 'Inactive' : 'Active',
          };
        });
        setPortalData((prev) => ({ ...prev, roster: list }));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'ambassadors');
      }
    );

    const unsubWorkshops = onSnapshot(
      collection(firestore, 'workshops'),
      (snap) => {
        if (snap.empty) return;
        const list: Workshop[] = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            title: String(v.title || ''),
            date: String(v.date || ''),
            mode: String(v.mode || ''),
            fee: String(v.fee || ''),
            seats: Number(v.seats || 60),
            regs: Number(v.regs || 0),
            tag: String(v.tag || ''),
          };
        });
        setPortalData((prev) => ({ ...prev, workshops: list }));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'workshops');
      }
    );

    return () => {
      unsubSystemConfig();
      unsubSettings();
      unsubAmbassadors();
      unsubWorkshops();
    };
  }, []);

  // 2. Firebase Auth State Listener + Role Resolution
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email) {
        setCurrentUser(null);
        setDashboardOpen(false);
        setAuthLoading(false);
        return;
      }

      const emailLower = fbUser.email.toLowerCase();
      const isMainDev = fbUser.emailVerified && isMainDeveloperEmail(emailLower);

      try {
        let assignment = await fetchRoleAssignmentForEmail(emailLower);

        // If a Main Developer signs in for the first time on an empty DB, seed initial cloud data cleanly
        if (isMainDev) {
          const seeded = await seedInitialFirestoreData();
          if (seeded) {
            showToast('Cloud Firestore initialized by Main Developer.');
            assignment = await fetchRoleAssignmentForEmail(emailLower);
          }
        }

        if (isMainDev) {
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: assignment?.displayName || fbUser.displayName || 'Main Developer',
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            assigned: true,
            isMainDeveloper: true,
            role: 'developer',
            squad: 'ALL',
            caCode: assignment?.caCode || 'UE-DEV-00',
            campus: assignment?.campus || 'Ulterior Engineering HQ',
          });
        } else {
          // Check moderation status (suspended / banned) before granting session
          const modRecord = await fetchUserModerationStatus(emailLower).catch(() => null);
          if (modRecord && (modRecord.status === 'suspended' || modRecord.status === 'banned')) {
            await signOut(auth);
            setCurrentUser(null);
            setDashboardOpen(false);
            setBlockedNotice({
              type: modRecord.status,
              title:
                modRecord.status === 'banned'
                  ? 'Your account has been permanently banned'
                  : 'Your account is currently suspended',
              reason:
                modRecord.reason ||
                'Access to the portal has been restricted by a Platform Developer.',
            });
            return;
          }

          // If Emergency Lockdown is active and user is not a Developer, sign out immediately
          const isSecondaryDev = assignment?.role === 'developer';
          if (systemConfigRef.current.emergencyLockdown && !isSecondaryDev) {
            await signOut(auth);
            setCurrentUser(null);
            setDashboardOpen(false);
            setBlockedNotice({
              type: 'lockdown',
              title: 'Signed Out — Emergency Read-Only Lockdown',
              reason: systemConfigRef.current.lockdownMessage,
            });
            return;
          }

          if (assignment) {
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: assignment.displayName || fbUser.displayName || fbUser.email,
              photoURL: fbUser.photoURL,
              emailVerified: fbUser.emailVerified,
              assigned: true,
              isMainDeveloper: false,
              role: assignment.role,
              squad: assignment.squad,
              caCode: assignment.caCode || '',
              campus: assignment.campus || '',
            });
          } else {
            setCurrentUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email,
              photoURL: fbUser.photoURL,
              emailVerified: fbUser.emailVerified,
              assigned: false,
              isMainDeveloper: false,
              role: null,
              squad: null,
              caCode: '',
              campus: '',
            });
          }
        }
      } catch (err) {
        console.error('Role resolution error:', err);
        setCurrentUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email,
          photoURL: fbUser.photoURL,
          emailVerified: fbUser.emailVerified,
          assigned: isMainDev,
          isMainDeveloper: isMainDev,
          role: isMainDev ? 'developer' : null,
          squad: isMainDev ? 'ALL' : null,
          caCode: isMainDev ? 'UE-DEV-00' : '',
          campus: '',
        });
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // 2B. Real-time Emergency Lockdown Enforcement: immediately sign out all non-developer users
  useEffect(() => {
    if (!systemConfig.emergencyLockdown) return;
    if (!currentUser || currentUser.role === 'developer') return;

    void signOut(auth).finally(() => {
      setCurrentUser(null);
      setDashboardOpen(false);
      setApplyModalState((s) => ({ ...s, open: false }));
      setActiveWorkshop(null);
      setSheetSyncOpen(false);
      setBlockedNotice({
        type: 'lockdown',
        title: 'Emergency Read-Only Lockdown Activated',
        reason: systemConfig.lockdownMessage,
      });
    });
  }, [systemConfig.emergencyLockdown, systemConfig.lockdownEpoch, systemConfig.lockdownMessage, currentUser]);

  // 2C. Real-time Suspension / Ban Listener for signed-in non-Main-Developer users
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified || currentUser.isMainDeveloper) return;
    const emailKey = normalizeEmailKey(currentUser.email);
    const unsub = onSnapshot(
      doc(firestore, 'user_moderation', emailKey),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        const status = d.status as UserModerationStatus;
        if (status === 'suspended' || status === 'banned') {
          void signOut(auth).finally(() => {
            setCurrentUser(null);
            setDashboardOpen(false);
            setBlockedNotice({
              type: status,
              title:
                status === 'banned'
                  ? 'Account Permanently Banned'
                  : 'Account Suspended by Administrator',
              reason:
                String(d.reason || '') ||
                'Your access has been restricted by a Platform Developer.',
            });
          });
        }
      },
      () => {
        // ignore transient read errors on sign-out
      }
    );
    return () => unsub();
  }, [currentUser]);

  // 3. Role-Scoped Protected Firestore Listeners (Strictly obeys Firestore RBAC rules!)
  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) {
      setPortalData((prev) => ({
        ...prev,
        submissions: [],
        applications: [],
        clubPitches: [],
        techPipeline: [],
        campaignKits: [],
        workshopRegistrations: [],
        roleAssignments: [],
      }));
      setUserModerations([]);
      setAuditLogs([]);
      setErrorLogs([]);
      return;
    }

    const unsubs: (() => void)[] = [];
    const role = currentUser.role;
    const hasFullAccess = isFullAccessRole(role);

    // A. Role Assignments (Developer, Appointed Chair/CEO, and Secretary for Manage Members)
    if (hasFullAccess || role === 'secretary') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'role_assignments'),
          (snap) => {
            const list: RoleAssignment[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                email: String(v.email || ''),
                displayName: String(v.displayName || ''),
                role: v.role as UserRole,
                squad: (v.squad || 'Squad A') as 'ALL' | SquadName,
                caCode: String(v.caCode || ''),
                campus: String(v.campus || ''),
                assignedBy: String(v.assignedBy || ''),
              };
            });
            setPortalData((prev) => ({ ...prev, roleAssignments: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'role_assignments')
        )
      );
    }

    // B. Certificates List (Developer, Chair & Secretary)
    if (hasFullAccess || role === 'secretary') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'certificates'),
          (snap) => {
            const list: CertificateRecord[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                holder: String(v.holder || ''),
                role: String(v.role || ''),
                campus: String(v.campus || ''),
                issued: String(v.issued || ''),
                status: v.status === 'Revoked' ? 'Revoked' : 'Valid',
              };
            });
            setPortalData((prev) => ({ ...prev, certificates: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'certificates')
        )
      );
    }

    // C. Recruitment Applications (Developer, Chair & Secretary see all; others see only their own)
    const appsQuery =
      hasFullAccess || role === 'secretary'
        ? collection(firestore, 'applications')
        : query(
            collection(firestore, 'applications'),
            where('applicantUid', '==', currentUser.uid)
          );
    unsubs.push(
      onSnapshot(
        appsQuery,
        (snap) => {
          const list: RecruitmentApplication[] = snap.docs.map((d) => {
            const v = d.data();
            return {
              id: d.id,
              name: String(v.name || ''),
              role: String(v.role || ''),
              campus: String(v.campus || ''),
              squad: (v.squad || 'Squad A') as SquadName,
              email: String(v.email || ''),
              applicantUid: String(v.applicantUid || ''),
              exp: String(v.exp || ''),
              status: (v.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
            };
          });
          setPortalData((prev) => ({ ...prev, applications: list }));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
      )
    );

    // D. Submissions (Developer/Chair/Secretary see all; Lead 1-5 see strictly their own Squad; CA sees own)
    if (currentUser.assigned && role) {
      const subsQuery =
        hasFullAccess || role === 'secretary'
          ? collection(firestore, 'submissions')
          : role.startsWith('lead')
          ? query(
              collection(firestore, 'submissions'),
              where('squad', '==', LEAD_TO_SQUAD[role as LeadRole])
            )
          : query(
              collection(firestore, 'submissions'),
              where('submitterUid', '==', currentUser.uid)
            );
      unsubs.push(
        onSnapshot(
          subsQuery,
          (snap) => {
            const list: ActivitySubmission[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                caCode: String(v.caCode || ''),
                caName: String(v.caName || ''),
                submitterUid: String(v.submitterUid || ''),
                squad: (v.squad || 'Squad A') as SquadName,
                type: (v.type || 'Brand Post') as SubmissionType,
                detail: String(v.detail || ''),
                date: String(v.date || ''),
                status: (v.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
              };
            });
            setPortalData((prev) => ({ ...prev, submissions: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );

      // E. Campaign Kits (All assigned members)
      unsubs.push(
        onSnapshot(
          collection(firestore, 'campaign_kits'),
          (snap) => {
            const list: CampaignKit[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                title: String(v.title || ''),
                author: String(v.author || ''),
                date: String(v.date || ''),
                copy: String(v.copy || ''),
                createdByUid: String(v.createdByUid || ''),
              };
            });
            setPortalData((prev) => ({ ...prev, campaignKits: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'campaign_kits')
        )
      );
    }

    // F. Tech Pipeline (Developer, Chair, Secretary, Lead 3)
    if (hasFullAccess || role === 'secretary' || role === 'lead3') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'tech_pipeline'),
          (snap) => {
            const list: TechLeadTicket[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                title: String(v.title || ''),
                campus: String(v.campus || ''),
                submittedBy: String(v.submittedBy || ''),
                submitterUid: String(v.submitterUid || ''),
                stage: (v.stage || 'New') as TechPipelineStage,
                value: String(v.value || ''),
              };
            });
            setPortalData((prev) => ({ ...prev, techPipeline: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'tech_pipeline')
        )
      );
    }

    // G. Club Pitches (Developer, Chair, Secretary, Lead 5)
    if (hasFullAccess || role === 'secretary' || role === 'lead5') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'club_pitches'),
          (snap) => {
            const list: ClubPitch[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                club: String(v.club || ''),
                university: String(v.university || ''),
                contact: String(v.contact || ''),
                type: String(v.type || ''),
                date: String(v.date || ''),
                status: (v.status || 'New') as ClubPitchStatus,
                submitterUid: String(v.submitterUid || ''),
              };
            });
            setPortalData((prev) => ({ ...prev, clubPitches: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'club_pitches')
        )
      );
    }

    // H. Workshop Registrations (Developer, Chair, Secretary, Lead 2)
    if (hasFullAccess || role === 'secretary' || role === 'lead2') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'workshop_registrations'),
          (snap) => {
            const list: WorkshopRegistration[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                workshopId: String(v.workshopId || ''),
                workshopTitle: String(v.workshopTitle || ''),
                participantName: String(v.participantName || ''),
                university: String(v.university || ''),
                email: String(v.email || ''),
                refCode: String(v.refCode || ''),
                registrarUid: String(v.registrarUid || ''),
              };
            });
            setPortalData((prev) => ({ ...prev, workshopRegistrations: list }));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'workshop_registrations')
        )
      );
    }

    // I. Developer-Only /admin Listeners (user_moderation, audit_logs, error_logs)
    if (role === 'developer') {
      unsubs.push(
        onSnapshot(
          collection(firestore, 'user_moderation'),
          (snap) => {
            const list: UserModerationRecord[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                email: String(v.email || ''),
                displayName: String(v.displayName || ''),
                status: (v.status || 'active') as UserModerationStatus,
                reason: String(v.reason || ''),
                updatedByName: String(v.updatedByName || ''),
                updatedByUid: String(v.updatedByUid || ''),
                updatedAt: timestampToDate(v.updatedAt),
              };
            });
            setUserModerations(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'user_moderation')
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(firestore, 'audit_logs'),
            orderBy('createdAt', 'desc'),
            limit(200)
          ),
          (snap) => {
            const list: AdminAuditLog[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                actorUid: String(v.actorUid || ''),
                actorEmail: String(v.actorEmail || ''),
                actorName: String(v.actorName || ''),
                action: (v.action || 'SYSTEM_CONFIG_UPDATED') as AdminAuditAction,
                target: String(v.target || ''),
                details: String(v.details || ''),
                createdAt: timestampToDate(v.createdAt),
              };
            });
            setAuditLogs(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(firestore, 'error_logs'),
            orderBy('createdAt', 'desc'),
            limit(200)
          ),
          (snap) => {
            const list: SystemErrorLog[] = snap.docs.map((d) => {
              const v = d.data();
              return {
                id: d.id,
                source: (v.source || 'runtime') as SystemErrorSource,
                severity: (v.severity || 'error') as SystemErrorSeverity,
                message: String(v.message || ''),
                path: String(v.path || '/'),
                operation: String(v.operation || 'runtime'),
                userUid: String(v.userUid || ''),
                userEmail: String(v.userEmail || ''),
                resolved: Boolean(v.resolved),
                createdAt: timestampToDate(v.createdAt),
              };
            });
            setErrorLogs(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'error_logs')
        )
      );
    } else {
      setUserModerations([]);
      setAuditLogs([]);
      setErrorLogs([]);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUser]);

  const referringCA = detectedRefCode
    ? portalData.roster.find((r) => r.code.toUpperCase() === detectedRefCode)
    : undefined;

  // Auth Actions
  const handleGoogleSignIn = async (
    intent: AuthSignInMode = 'standard',
    emailHint?: string
  ) => {
    setSigningIn(true);
    setAuthError(null);
    try {
      googleProvider.setCustomParameters(
        emailHint ? { prompt: 'select_account', login_hint: emailHint } : { prompt: 'select_account' }
      );
      const cred = await signInWithPopup(auth, googleProvider);
      const signedEmail = cred.user.email?.toLowerCase() || '';
      const isMainDev = cred.user.emailVerified && isMainDeveloperEmail(signedEmail);
      const assignment = signedEmail ? await fetchRoleAssignmentForEmail(signedEmail) : null;
      const resolvedRole: UserRole | null = isMainDev ? 'developer' : assignment?.role ?? null;

      // Check suspension / ban before allowing entry
      if (!isMainDev && signedEmail) {
        const mod = await fetchUserModerationStatus(signedEmail).catch(() => null);
        if (mod && (mod.status === 'suspended' || mod.status === 'banned')) {
          await signOut(auth);
          setDashboardOpen(false);
          setAuthModalOpen(false);
          setBlockedNotice({
            type: mod.status,
            title:
              mod.status === 'banned'
                ? 'Account Permanently Banned'
                : 'Account Currently Suspended',
            reason:
              mod.reason ||
              'Your account has been restricted by a Platform Developer.',
          });
          return;
        }
      }

      // During Emergency Lockdown, block all non-developer sign-ins / sign-ups
      if (systemConfigRef.current.emergencyLockdown && resolvedRole !== 'developer') {
        await signOut(auth);
        setDashboardOpen(false);
        setAuthModalMode(intent);
        setAuthModalOpen(true);
        setAuthError(
          'Emergency Read-Only Lockdown is active. Only authorized Platform Developers may sign in.'
        );
        return;
      }

      if (intent === 'developer') {
        if (resolvedRole !== 'developer') {
          await signOut(auth);
          setDashboardOpen(false);
          setAuthModalMode('developer');
          if (!isAdminRoute) {
            setAuthModalOpen(true);
          }
          setAuthError(
            'Access Denied. This Google account is not authorized for Developer Mode.'
          );
          return;
        }
        setAuthModalOpen(false);
        if (!isAdminRoute) {
          setDashboardOpen(true);
        }
        showToast(
          isMainDev
            ? 'Main Developer Root Console unlocked (Permanent Tier 0A).'
            : 'Developer Root Console unlocked (Tier 0B).'
        );
        return;
      }

      if (intent === 'executive') {
        if (
          resolvedRole !== 'chair' &&
          resolvedRole !== 'ceo' &&
          resolvedRole !== 'developer'
        ) {
          await signOut(auth);
          setDashboardOpen(false);
          setAuthModalMode('executive');
          setAuthModalOpen(true);
          setAuthError(
            `Access Denied for ${signedEmail || 'this account'}. This email is not authorized for Program Chair or Company CEO access. Ask a Platform Developer to authorize your email.`
          );
          return;
        }
        setAuthModalOpen(false);
        setDashboardOpen(true);
        showToast(
          resolvedRole === 'ceo'
            ? 'Company CEO Executive Console unlocked (Full Chair Access).'
            : resolvedRole === 'chair'
            ? 'Program Chair Console unlocked (Full Operational Access).'
            : 'Developer Executive Access unlocked.'
        );
        return;
      }

      setAuthModalOpen(false);
      setDashboardOpen(true);
      showToast('Signed in with Google.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in cancelled';
      showToast(`Sign in failed: ${message}`);
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDashboardOpen(false);
    showToast('Signed out securely.');
  };

  const handleOpenAuthOrDashboard = (mode: AuthSignInMode = 'standard') => {
    if (currentUser) {
      setDashboardOpen(true);
    } else {
      setAuthError(null);
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    }
  };

  // Public & Dashboard Actions wired to Cloud Firestore
  const handleApply = (role: string, squad?: SquadName) => {
    if (systemConfig.emergencyLockdown && currentUser?.role !== 'developer') {
      showToast('Emergency Read-Only Lockdown is active. Applications are temporarily paused.');
      return;
    }
    if (!hasAnyOpenRecruitmentRole(portalData.recruitmentStatus)) {
      showToast('All recruitment positions are currently closed.');
      return;
    }
    const targetRole = isRoleOpenForRecruitment(portalData.recruitmentStatus, role)
      ? role
      : getFirstOpenRecruitmentRoleTitle(portalData.recruitmentStatus);
    if (!targetRole) {
      showToast('Recruitment for this position is currently closed.');
      return;
    }
    setApplyModalState({
      open: true,
      role: targetRole,
      squad: squad || 'Squad A',
    });
  };

  const handleSubmitApplication = async (app: {
    role: string;
    name: string;
    campus: string;
    squad: SquadName;
    email: string;
    exp: string;
  }) => {
    await submitApplicationDoc(app);
    showToast('Application saved to Cloud Firestore for Chair & Secretary review.');
  };

  const handleSubmitWorkshopReg = async (reg: {
    workshopId: string;
    workshopTitle: string;
    participantName: string;
    university: string;
    email: string;
    refCode: string;
  }) => {
    try {
      await submitWorkshopRegistrationDoc({
        ...reg,
        roster: portalData.roster,
      });
      showToast(
        reg.refCode
          ? `Registered! Referral ${reg.refCode} logged to the Squad Lead & Secretary queue.`
          : `Workshop registration confirmed for ${reg.participantName}.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to register for workshop.';
      showToast(msg);
      throw err;
    }
  };

  const handleVerifyCertificate = async (
    id: string
  ): Promise<CertificateRecord | null> => {
    try {
      const cloudRecord = await verifyCertificateById(id);
      if (cloudRecord) return cloudRecord;
    } catch {
      // fallback to seeded default if DB not yet seeded
    }
    return (
      portalData.certificates.find((c) => c.id.toUpperCase() === id.toUpperCase()) ||
      null
    );
  };

  const handleSubmitClubPitch = async (pitch: {
    club: string;
    university: string;
    contact: string;
    type: string;
  }) => {
    await submitClubPitchDoc(pitch);
    showToast('Club partnership inquiry saved and routed to Lead 5 & Secretary.');
  };

  const handleSyncGoogleSheetCSV = async (url: string) => {
    try {
      const safeUrl = validateGoogleSheetsCsvUrl(url);
      const res = await fetch(safeUrl);
      if (!res.ok) throw new Error('Could not fetch CSV');
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error('CSV appears empty');

      const parsed: Omit<Ambassador, 'id'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(',')
          .map((c) => c.replace(/^"|"$/g, '').trim());
        if (!cols[0]) continue;
        const candidateSquad = cols[2] as SquadName;
        parsed.push({
          name: cols[0],
          campus: cols[1] || 'Campus',
          squad: SQUADS_META[candidateSquad] ? candidateSquad : 'Squad A',
          code: (cols[3] || `UE-S${100 + i}`).toUpperCase(),
          workshopRegs: parseInt(cols[4], 10) || 0,
          techLeads: parseInt(cols[5], 10) || 0,
          brandPosts: parseInt(cols[6], 10) || 0,
          clubEvents: 0,
          status: cols[7] === 'Inactive' ? 'Inactive' : 'Active',
        });
      }
      if (!parsed.length) throw new Error('No valid rows found');
      await syncRosterBatchToFirestore(parsed);
      showToast(`Synced ${parsed.length} ambassadors into Cloud Firestore.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      showToast(`Sync failed: ${msg}`);
      throw err;
    }
  };

  const sanitizeCsvCell = (raw: string | number): string => {
    const str = String(raw ?? '');
    const neutralized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${neutralized.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const header =
      'Name,Campus,Squad,ReferralCode,WorkshopRegs,TechLeads,BrandPosts,TotalPoints,Status\n';
    const rows = portalData.roster
      .map((r) =>
        [
          sanitizeCsvCell(r.name),
          sanitizeCsvCell(r.campus),
          sanitizeCsvCell(r.squad),
          sanitizeCsvCell(r.code),
          r.workshopRegs,
          r.techLeads,
          r.brandPosts,
          calcPoints(r, portalData.kpiWeights),
          sanitizeCsvCell(r.status),
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `UE_CA_Monthly_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    showToast('Exported Monthly Squad Performance Log (.csv).');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(portalData, null, 2)], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `UE_CA_Cloud_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    showToast('Exported complete JSON portal backup.');
  };

  const handleCopyText = (text: string, message: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(message))
        .catch(() => showToast(text));
    } else {
      showToast(text);
    }
  };

  const isDeveloper = Boolean(
    currentUser && currentUser.emailVerified && currentUser.role === 'developer'
  );
  const readOnlyLockdown = systemConfig.emergencyLockdown && !isDeveloper;

  const canBulkSyncCSV =
    !readOnlyLockdown &&
    !!currentUser?.assigned &&
    (isFullAccessRole(currentUser.role) || currentUser.role === 'lead1');

  // ROUTE 1: Dedicated Developer-Only /admin Control Center
  const adminElement = (
    <>
        <AdminPage
          currentUser={currentUser}
          authLoading={authLoading}
          signingIn={signingIn}
          authError={authError}
          systemConfig={systemConfig}
          portalData={portalData}
          userModerations={userModerations}
          auditLogs={auditLogs}
          errorLogs={errorLogs}
          onDeveloperSignIn={() => handleGoogleSignIn('developer')}
          onLogout={handleLogout}
          onNavigateHome={() => navigateTo('/')}
          onOpenRoleDashboard={() => {
            navigateTo('/');
            setDashboardOpen(true);
          }}
          onNotify={showToast}
        />

        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-[70] max-w-sm bg-[#111318] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-[#262B35]"
          >
            {toastMsg}
          </div>
        )}

        <AccountBlockedModal
          notice={blockedNotice}
          onDismiss={() => setBlockedNotice(null)}
        />
    </>
  );

  // ROUTE 1B: /profile — signed-in member profile (own or ?uid=<uid> for another member)
  // Rendered before the maintenance gate, like /admin, so members can always reach it.
  const profileElement = (
    <>
        <ProfilePage
          currentUser={currentUser}
          authLoading={authLoading}
          onNavigateHome={() => navigateTo('/')}
          onNavigateMembers={() => navigateTo('/members')}
          onNotify={showToast}
          onSignIn={() => void handleGoogleSignIn('standard')}
        />

        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-[70] max-w-sm bg-[#111318] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-[#262B35]"
          >
            {toastMsg}
          </div>
        )}

        <AccountBlockedModal
          notice={blockedNotice}
          onDismiss={() => setBlockedNotice(null)}
        />
    </>
  );

  // ROUTE 1C: /members — Manage Members (Chair / Secretary / developer only; page enforces)
  const membersElement = (
    <>
        <MembersPage
          currentUser={currentUser}
          authLoading={authLoading}
          portalData={portalData}
          onNavigateHome={() => navigateTo('/')}
          onOpenProfile={(uid) => navigateTo(`/profile?uid=${encodeURIComponent(uid)}`)}
          onNotify={showToast}
        />

        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-[70] max-w-sm bg-[#111318] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-[#262B35]"
          >
            {toastMsg}
          </div>
        )}

        <AccountBlockedModal
          notice={blockedNotice}
          onDismiss={() => setBlockedNotice(null)}
        />
    </>
  );

  // ROUTE 2: Maintenance Mode Gate (Everyone except role = developer sees Maintenance Page)
  const maintenanceElement = (
    <>
        <MaintenanceScreen
          config={systemConfig}
          signingIn={signingIn}
          onDeveloperSignIn={() => handleGoogleSignIn('developer')}
          onOpenAdminRoute={() => navigateTo('/admin')}
        />

        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-[70] max-w-sm bg-[#111318] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-[#262B35]"
          >
            {toastMsg}
          </div>
        )}

        <AccountBlockedModal
          notice={blockedNotice}
          onDismiss={() => setBlockedNotice(null)}
        />
    </>
  );

  const publicLayout = (
    <div className="min-h-screen pb-20 lg:pb-0 bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100">
      <SystemStatusBanner
        config={systemConfig}
        isDeveloper={isDeveloper}
        onOpenAdmin={() => navigateTo('/admin')}
      />

      <Header
        detectedRefCode={detectedRefCode}
        referringCA={referringCA}
        currentUser={currentUser}
        authLoading={authLoading}
        onOpenAuthOrDashboard={() => handleOpenAuthOrDashboard('standard')}
        onOpenAdminPage={() => navigateTo('/admin')}
        onNavigatePath={navigateTo}
      />

      <main>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  db={portalData}
                  currentUser={currentUser}
                  onApply={handleApply}
                  onOpenDashboard={() => handleOpenAuthOrDashboard('standard')}
                  onOpenExecutiveSignIn={() => handleOpenAuthOrDashboard('executive')}
                />
              }
            />
            <Route
              path="/architecture"
              element={<ArchitecturePage db={portalData} onApply={handleApply} />}
            />
            <Route
              path="/excom"
              element={
                <ExComPage
                  db={portalData}
                  currentUser={currentUser}
                  onApply={handleApply}
                  onOpenPersonalPortal={() => handleOpenAuthOrDashboard('standard')}
                  onOpenExecutivePortal={() => handleOpenAuthOrDashboard('executive')}
                />
              }
            />
            <Route
              path="/squads"
              element={
                <SquadsPage
                  db={portalData}
                  currentUser={currentUser}
                  onApply={handleApply}
                  onOpenPersonalPortal={() => handleOpenAuthOrDashboard('standard')}
                  onOpenExecutivePortal={() => handleOpenAuthOrDashboard('executive')}
                />
              }
            />
            <Route
              path="/leaderboard"
              element={
                <LeaderboardPage
                  db={portalData}
                  onOpenSheetSync={() => setSheetSyncOpen(true)}
                  onExportCSV={handleExportCSV}
                />
              }
            />
            <Route
              path="/workshops"
              element={
                <WorkshopsPage
                  db={portalData}
                  currentUser={currentUser}
                  readOnlyLockdown={readOnlyLockdown}
                  onRequireSignIn={() => handleGoogleSignIn('standard')}
                  onSelectWorkshop={(ws) => setActiveWorkshop(ws)}
                  onVerifyCertificate={handleVerifyCertificate}
                  onSubmitClubPitch={handleSubmitClubPitch}
                />
              }
            />
            <Route
              path="/verify"
              element={
                <VerifyPage
                  db={portalData}
                  currentUser={currentUser}
                  readOnlyLockdown={readOnlyLockdown}
                  onRequireSignIn={() => handleGoogleSignIn('standard')}
                  onSelectWorkshop={(ws) => setActiveWorkshop(ws)}
                  onVerifyCertificate={handleVerifyCertificate}
                  onSubmitClubPitch={handleSubmitClubPitch}
                />
              }
            />
            <Route path="/download" element={<DownloadPage />} />
            <Route
              path="/signin"
              element={
                <SignInPage
                  currentUser={currentUser}
                  authLoading={authLoading}
                  onOpenAuthOrDashboard={handleOpenAuthOrDashboard}
                />
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Quiet Footer with Direct App Download Button */}
      <footer className="border-t border-[#E2E5EB] dark:border-[#262B35] py-10 pb-20 text-xs text-[#5A6270] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-extrabold text-[#111318] dark:text-white tracking-tight">
              Ulterior Engineering
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ca.ulteriorengineering.com</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PWAInstallButton variant="compact" />
            <a
              href="https://ulteriorengineering.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#B51B27] transition-colors"
            >
              Main Website
            </a>
            <button
              type="button"
              disabled={!hasAnyOpenRecruitmentRole(portalData.recruitmentStatus)}
              onClick={() => handleApply('General Campus Ambassador')}
              className="hover:text-[#B51B27] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {hasAnyOpenRecruitmentRole(portalData.recruitmentStatus)
                ? 'Recruitment'
                : 'Recruitment Closed'}
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuthOrDashboard('standard')}
              className="hover:text-[#B51B27] transition-colors cursor-pointer"
            >
              Personal Sign In
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuthOrDashboard('executive')}
              className="font-medium text-[#111318] dark:text-slate-200 hover:text-[#B51B27] transition-colors cursor-pointer"
            >
              Chair &amp; CEO Sign In
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuthOrDashboard('developer')}
              className="font-mono font-semibold text-[#111318] dark:text-slate-200 hover:text-[#B51B27] transition-colors cursor-pointer"
            >
              Developer Sign In
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin')}
              className="font-mono font-semibold text-[#B51B27] hover:underline transition-colors cursor-pointer"
            >
              /admin
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom-Left Theme Toggle */}
      <div className="fixed bottom-20 lg:bottom-4 left-4 z-40">
        <div
          role="group"
          aria-label="Color theme"
          className="inline-flex items-center p-1 rounded-full bg-white/95 dark:bg-[#15181E]/95 border border-[#E2E5EB] dark:border-[#262B35] shadow-md backdrop-blur"
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
              theme === 'light'
                ? 'bg-[#B51B27] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#B51B27] text-white'
                : 'text-[#5A6270] hover:text-[#111318]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Bottom-Right Playbook Guide Trigger */}
      <div className="fixed bottom-20 lg:bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          className="bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-md inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Playbook Guide</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-[70] max-w-sm bg-[#111318] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-[#262B35]"
        >
          {toastMsg}
        </div>
      )}

      {/* Personal Role-Locked Dashboard Overlay */}
      {dashboardOpen && currentUser && (
        <RoleDashboard
          db={portalData}
          user={currentUser}
          onClose={() => setDashboardOpen(false)}
          onOpenAdminPage={() => {
            setDashboardOpen(false);
            navigateTo('/admin');
          }}
          onLogout={handleLogout}
          onApplyForRole={() => {
            setDashboardOpen(false);
            handleApply('General Campus Ambassador');
          }}
          onSeedCloudDB={async () => {
            await seedInitialFirestoreData();
            showToast('Default playbook data seeded to Cloud Firestore.');
          }}
          onUpdateRecruitmentStatus={async (nextStatus: RecruitmentStatusMap) => {
            await updateRecruitmentStatusDoc(nextStatus);
            const openCount = Object.values(nextStatus).filter(Boolean).length;
            showToast(
              `Recruitment availability updated (${openCount} of 7 positions open).`
            );
          }}
          onUpsertRole={async (input) => {
            await upsertRoleAssignment(input);
            if (currentUser.role === 'developer') {
              await writeAdminAuditLog(
                'ROLE_ASSIGNED',
                input.email.toLowerCase(),
                `Assigned role "${input.role}" (${input.squad}) to ${input.displayName} (${input.email}).`
              ).catch(() => {});
            }
            showToast(`Assigned ${input.role.toUpperCase()} access to ${input.email}.`);
          }}
          onDeleteRole={async (emailKey) => {
            const target = portalData.roleAssignments.find((r) => r.id === emailKey);
            if (currentUser.role === 'developer' && target) {
              await revokeUserRoleWithAudit({
                emailKey,
                email: target.email,
                previousRole: target.role,
                reason: 'Role revoked from Developer Role Dashboard',
              });
            } else {
              await removeRoleAssignment(emailKey);
            }
            showToast('Role access revoked.');
          }}
          onAddAmbassador={async (input) => {
            await addOrUpdateAmbassador({
              ...input,
              workshopRegs: 0,
              techLeads: 0,
              brandPosts: 0,
              clubEvents: 0,
              status: 'Active',
            });
            showToast(`${input.name} added to Cloud Firestore roster.`);
          }}
          onReviewSubmission={async (subId, caCode, type, decision) => {
            await reviewSubmissionAtomic({
              subId,
              caCode,
              type,
              decision,
              roster: portalData.roster,
            });
            showToast(`Submission ${decision.toLowerCase()} — Cloud Leaderboard updated.`);
          }}
          onSubmitCAProof={async (type, detail) => {
            const squad: SquadName =
              currentUser.squad && currentUser.squad !== 'ALL'
                ? currentUser.squad
                : 'Squad A';
            await submitCAProofDoc({
              caCode: currentUser.caCode || 'UE-A101',
              caName: currentUser.displayName,
              campus: currentUser.campus || 'Campus',
              squad,
              type,
              detail,
            });
            showToast('Proof saved to Cloud Firestore for Squad Lead & Secretary review.');
          }}
          onUpdateLeadStage={async (id, stage) => {
            await updateTechLeadStageDoc(id, stage);
            showToast(`Ticket ${id} moved to "${stage}".`);
          }}
          onPublishCampaignKit={async (title, copy) => {
            await publishCampaignKitDoc({
              title,
              author:
                currentUser.role === 'developer'
                  ? 'Tier 0 · Platform Developer'
                  : currentUser.role === 'ceo'
                  ? 'Tier 1 · Company CEO'
                  : currentUser.role === 'secretary'
                  ? 'Tier 2 · Program Secretary'
                  : currentUser.role === 'lead4'
                  ? 'Tier 3 · Lead 4 (Brand & PR)'
                  : 'Tier 1 · Program Chair',
              copy,
            });
            showToast('Campaign kit published live to all ambassadors.');
          }}
          onDeleteCampaignKit={async (kitId) => {
            await deleteCampaignKitDoc(kitId);
            showToast('Campaign kit deleted.');
          }}
          onApproveApplication={async (appId) => {
            const app = portalData.applications.find((a) => a.id === appId);
            if (!app) return;
            const hasFull = isFullAccessRole(currentUser.role);
            await approveApplicationAndOnboard(app, hasFull);
            showToast(
              hasFull
                ? `${app.name} approved and granted personal portal access.`
                : `${app.name} marked approved for final onboarding.`
            );
          }}
          onRejectApplication={async (appId) => {
            await rejectApplicationDoc(appId);
            showToast('Application marked as rejected.');
          }}
          onUpdateKpiWeights={async (weights: KpiWeights) => {
            await saveProgramSettings(weights, portalData.secretaryName);
            showToast('KPI weights saved to Cloud Firestore.');
          }}
          onIssueCertificate={async (holder, campus, role) => {
            const id = await issueCertificateDoc({
              holder,
              campus,
              role,
              existingCount: portalData.certificates.length,
            });
            showToast(`Issued certificate ${id} — live in Cloud Registry.`);
          }}
          onToggleCertStatus={async (id, currentStatus) => {
            await toggleCertificateStatusDoc(id, currentStatus);
            showToast(`Updated certificate ${id} status.`);
          }}
          onCreateWorkshop={async (title, date, fee) => {
            await createWorkshopDoc({
              title,
              date,
              mode: 'Ulterior Engineering Official',
              fee,
              seats: 60,
              tag: 'New Launch',
            });
            showToast('New workshop published live to Cloud Firestore.');
          }}
          onUpdateClubPitchStatus={async (pitchId, status) => {
            await updateClubPitchStatusDoc(pitchId, status);
            showToast(`Club inquiry updated to "${status}".`);
          }}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onCopyText={handleCopyText}
        />
      )}

      {/* Modals & Drawers */}
      <AuthModal
        open={authModalOpen}
        initialMode={authModalMode}
        signingIn={signingIn}
        authError={authError}
        emergencyLockdown={systemConfig.emergencyLockdown}
        onClearError={() => setAuthError(null)}
        onClose={() => {
          setAuthError(null);
          setAuthModalOpen(false);
        }}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <ApplyModal
        open={applyModalState.open}
        defaultRole={applyModalState.role}
        defaultSquad={applyModalState.squad}
        recruitmentStatus={portalData.recruitmentStatus}
        currentUser={currentUser}
        readOnlyLockdown={readOnlyLockdown}
        onRequireSignIn={() => handleGoogleSignIn('standard')}
        onClose={() => setApplyModalState((s) => ({ ...s, open: false }))}
        onSubmit={handleSubmitApplication}
      />

      <WorkshopModal
        workshop={activeWorkshop}
        defaultRefCode={detectedRefCode}
        currentUser={currentUser}
        readOnlyLockdown={readOnlyLockdown}
        onRequireSignIn={() => handleGoogleSignIn('standard')}
        onClose={() => setActiveWorkshop(null)}
        onSubmit={handleSubmitWorkshopReg}
      />

      <SheetSyncModal
        open={sheetSyncOpen}
        canSync={canBulkSyncCSV}
        readOnlyLockdown={readOnlyLockdown}
        onClose={() => setSheetSyncOpen(false)}
        onSync={handleSyncGoogleSheetCSV}
      />

      <PlaybookGuideDrawer
        open={guideOpen}
        kpiWeights={portalData.kpiWeights}
        onClose={() => setGuideOpen(false)}
      />

      <AccountBlockedModal
        notice={blockedNotice}
        onDismiss={() => setBlockedNotice(null)}
      />

      {/* Mobile bottom tab bar + Menu sheet */}
      <MobileBottomNav currentUser={currentUser} />
    </div>
  );

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<PageSkeleton />}>{adminElement}</Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense fallback={<PageSkeleton />}>{profileElement}</Suspense>
          }
        />
        <Route
          path="/members"
          element={
            <Suspense fallback={<PageSkeleton />}>{membersElement}</Suspense>
          }
        />
        <Route
          path="/*"
          element={
            systemConfig.maintenanceMode && !isDeveloper
              ? maintenanceElement
              : publicLayout
          }
        />
      </Routes>
    </>
  );
}
