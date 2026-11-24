import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardList,
  Download,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Terminal,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  Wrench,
} from 'lucide-react';
import {
  MAIN_DEVELOPER_EMAIL_KEYS,
  normalizeEmailKey,
} from '../lib/firebase';
import {
  deleteErrorLogWithAudit,
  ensureSystemConfigDoc,
  logSystemError,
  revokeUserRoleWithAudit,
  setUserModerationStatusWithAudit,
  toggleErrorLogResolvedWithAudit,
  updateSystemConfigWithAudit,
} from '../services/adminService';
import { ROLE_LABELS } from '../services/portalService';
import {
  AdminAuditLog,
  PortalDB,
  PortalUser,
  SystemConfig,
  SystemErrorLog,
  UserModerationRecord,
  UserModerationStatus,
  UserRole,
} from '../types';

type AdminTab = 'system' | 'users' | 'audit' | 'errors';

interface AdminPageProps {
  currentUser: PortalUser | null;
  authLoading: boolean;
  signingIn: boolean;
  authError: string | null;
  systemConfig: SystemConfig;
  portalData: PortalDB;
  userModerations: UserModerationRecord[];
  auditLogs: AdminAuditLog[];
  errorLogs: SystemErrorLog[];
  onDeveloperSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
  onNavigateHome: () => void;
  onOpenRoleDashboard: () => void;
  onNotify: (msg: string) => void;
}

interface UnifiedDirectoryUser {
  emailKey: string;
  email: string;
  displayName: string;
  role: UserRole | null;
  squad: string;
  campus: string;
  caCode: string;
  moderationStatus: UserModerationStatus;
  moderationReason: string;
  moderationUpdatedAt: Date | null;
  isMainDeveloper: boolean;
  sourceLabel: string;
}

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return 'Just now';
  try {
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return d.toISOString();
  }
}

export function AdminPage({
  currentUser,
  authLoading,
  signingIn,
  authError,
  systemConfig,
  portalData,
  userModerations,
  auditLogs,
  errorLogs,
  onDeveloperSignIn,
  onLogout,
  onNavigateHome,
  onOpenRoleDashboard,
  onNotify,
}: AdminPageProps) {
  const isDeveloper = Boolean(
    currentUser && currentUser.emailVerified && currentUser.role === 'developer'
  );
  const isMainDeveloper = Boolean(isDeveloper && currentUser?.isMainDeveloper);

  const [activeTab, setActiveTab] = useState<AdminTab>('system');

  // System Controls state
  const [maintenanceDraft, setMaintenanceDraft] = useState(systemConfig.maintenanceMessage);
  const [lockdownDraft, setLockdownDraft] = useState(systemConfig.lockdownMessage);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmLockdownOpen, setConfirmLockdownOpen] = useState(false);

  // Direct User Moderation form state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetStatus, setTargetStatus] = useState<UserModerationStatus>('suspended');
  const [targetReason, setTargetReason] = useState('');

  // Inline Moderation Prompt state
  const [actionModal, setActionModal] = useState<{
    user: UnifiedDirectoryUser;
    mode: 'suspended' | 'banned' | 'active' | 'revoke_role';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Directory filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'roles' | 'suspended' | 'banned'>('all');

  // Audit Log filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<'all' | 'system' | 'users' | 'roles' | 'errors'>('all');

  // Error Log filters
  const [errorStatusFilter, setErrorStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [errorSourceFilter, setErrorSourceFilter] = useState<string>('all');

  useEffect(() => {
    setMaintenanceDraft(systemConfig.maintenanceMessage);
    setLockdownDraft(systemConfig.lockdownMessage);
  }, [systemConfig.maintenanceMessage, systemConfig.lockdownMessage]);

  // Ensure config/system document exists once a Developer opens /admin
  useEffect(() => {
    if (isDeveloper) {
      void ensureSystemConfigDoc().catch(() => {
        // handled by handleFirestoreError observer
      });
    }
  }, [isDeveloper]);

  // Build unified user directory across role_assignments, user_moderation, applications, and workshop_registrations
  const unifiedUsers = useMemo<UnifiedDirectoryUser[]>(() => {
    const map = new Map<string, UnifiedDirectoryUser>();

    for (const ra of portalData.roleAssignments) {
      const key = ra.id || normalizeEmailKey(ra.email);
      map.set(key, {
        emailKey: key,
        email: ra.email.toLowerCase(),
        displayName: ra.displayName || ra.email,
        role: ra.role,
        squad: ra.squad,
        campus: ra.campus,
        caCode: ra.caCode,
        moderationStatus: 'active',
        moderationReason: '',
        moderationUpdatedAt: null,
        isMainDeveloper: MAIN_DEVELOPER_EMAIL_KEYS.includes(key),
        sourceLabel: 'Role Registry',
      });
    }

    for (const app of portalData.applications) {
      if (!app.email) continue;
      const key = normalizeEmailKey(app.email);
      if (!map.has(key)) {
        map.set(key, {
          emailKey: key,
          email: app.email.toLowerCase(),
          displayName: app.name || app.email,
          role: null,
          squad: app.squad,
          campus: app.campus,
          caCode: '',
          moderationStatus: 'active',
          moderationReason: '',
          moderationUpdatedAt: null,
          isMainDeveloper: MAIN_DEVELOPER_EMAIL_KEYS.includes(key),
          sourceLabel: 'Applicant',
        });
      }
    }

    for (const reg of portalData.workshopRegistrations) {
      if (!reg.email) continue;
      const key = normalizeEmailKey(reg.email);
      if (!map.has(key)) {
        map.set(key, {
          emailKey: key,
          email: reg.email.toLowerCase(),
          displayName: reg.participantName || reg.email,
          role: null,
          squad: '—',
          campus: reg.university || '',
          caCode: reg.refCode || '',
          moderationStatus: 'active',
          moderationReason: '',
          moderationUpdatedAt: null,
          isMainDeveloper: MAIN_DEVELOPER_EMAIL_KEYS.includes(key),
          sourceLabel: 'Workshop Registrant',
        });
      }
    }

    for (const mod of userModerations) {
      const key = mod.id || normalizeEmailKey(mod.email);
      const existing = map.get(key);
      if (existing) {
        existing.moderationStatus = mod.status;
        existing.moderationReason = mod.reason;
        existing.moderationUpdatedAt = mod.updatedAt ?? null;
        if (!existing.displayName && mod.displayName) {
          existing.displayName = mod.displayName;
        }
      } else {
        map.set(key, {
          emailKey: key,
          email: mod.email.toLowerCase(),
          displayName: mod.displayName || mod.email,
          role: null,
          squad: '—',
          campus: '',
          caCode: '',
          moderationStatus: mod.status,
          moderationReason: mod.reason,
          moderationUpdatedAt: mod.updatedAt ?? null,
          isMainDeveloper: MAIN_DEVELOPER_EMAIL_KEYS.includes(key),
          sourceLabel: 'Moderation Record',
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const rank = (u: UnifiedDirectoryUser) =>
        u.moderationStatus === 'banned'
          ? 0
          : u.moderationStatus === 'suspended'
          ? 1
          : u.isMainDeveloper
          ? 2
          : u.role === 'developer'
          ? 3
          : u.role
          ? 4
          : 5;
      const diff = rank(a) - rank(b);
      return diff !== 0 ? diff : a.email.localeCompare(b.email);
    });
  }, [
    portalData.roleAssignments,
    portalData.applications,
    portalData.workshopRegistrations,
    userModerations,
  ]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return unifiedUsers.filter((u) => {
      if (userFilter === 'roles' && !u.role) return false;
      if (userFilter === 'suspended' && u.moderationStatus !== 'suspended') return false;
      if (userFilter === 'banned' && u.moderationStatus !== 'banned') return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        u.campus.toLowerCase().includes(q)
      );
    });
  }, [unifiedUsers, userSearch, userFilter]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter((entry) => {
      if (auditCategory === 'system') {
        if (
          ![
            'MAINTENANCE_ENABLED',
            'MAINTENANCE_DISABLED',
            'LOCKDOWN_ENABLED',
            'LOCKDOWN_DISABLED',
            'SYSTEM_CONFIG_UPDATED',
          ].includes(entry.action)
        ) {
          return false;
        }
      } else if (auditCategory === 'users') {
        if (!['USER_SUSPENDED', 'USER_BANNED', 'USER_RESTORED'].includes(entry.action)) {
          return false;
        }
      } else if (auditCategory === 'roles') {
        if (!['ROLE_REVOKED', 'ROLE_ASSIGNED'].includes(entry.action)) {
          return false;
        }
      } else if (auditCategory === 'errors') {
        if (!['ERROR_LOG_RESOLVED', 'ERROR_LOG_DELETED'].includes(entry.action)) {
          return false;
        }
      }
      if (!q) return true;
      return (
        entry.actorEmail.toLowerCase().includes(q) ||
        entry.actorName.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.target.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch, auditCategory]);

  const filteredErrorLogs = useMemo(() => {
    return errorLogs.filter((err) => {
      if (errorStatusFilter === 'open' && err.resolved) return false;
      if (errorStatusFilter === 'resolved' && !err.resolved) return false;
      if (errorSourceFilter !== 'all' && err.source !== errorSourceFilter) return false;
      return true;
    });
  }, [errorLogs, errorStatusFilter, errorSourceFilter]);

  // ==================== GATE 1: LOADING ====================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
          Verifying Developer clearance for /admin...
        </div>
      </div>
    );
  }

  // ==================== GATE 2: NOT SIGNED IN ====================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] swiss-grid flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl p-8 space-y-5 shadow-xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
            <Terminal className="w-4 h-4" />
            <span>/admin · Developer-Only Control Center</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#111318] dark:text-white">
            Developer Authentication Required
          </h1>
          <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
            This route is strictly restricted to accounts with{' '}
            <code className="font-mono text-[#B51B27] font-semibold">role = developer</code>.
            Sign in with an authorized Developer Google account to manage Maintenance Mode,
            Emergency Lockdown, User Moderation, Audit Logs, and Error Logs.
          </p>

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void onDeveloperSignIn()}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#111318] hover:bg-[#B51B27] disabled:opacity-60 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>
                {signingIn ? 'Verifying Developer Account...' : 'Sign In as Developer (Google)'}
              </span>
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full inline-flex items-center justify-center gap-1.5 border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== GATE 3: SIGNED IN, BUT NOT ROLE = DEVELOPER ====================
  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] swiss-grid flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-lg w-full bg-white dark:bg-[#15181E] border border-red-200 dark:border-red-900/60 rounded-2xl p-8 space-y-5 shadow-xl">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
            <Lock className="w-4 h-4" />
            <span>403 · Access Forbidden</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#111318] dark:text-white">
            Developer Role Required
          </h1>
          <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
            You are signed in as{' '}
            <strong className="text-[#111318] dark:text-white">{currentUser.email}</strong> (role:{' '}
            <code className="font-mono text-[#B51B27]">
              {currentUser.role || 'unassigned'}
            </code>
            ). The <code className="font-mono">/admin</code> control plane is locked exclusively to{' '}
            <code className="font-mono font-semibold">role = developer</code> accounts.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Portal</span>
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out &amp; Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== HANDLERS ====================
  const handleToggleMaintenance = async () => {
    const nextState = !systemConfig.maintenanceMode;
    setBusyAction('maintenance');
    try {
      await updateSystemConfigWithAudit({
        maintenanceMode: nextState,
        maintenanceMessage: maintenanceDraft,
        emergencyLockdown: systemConfig.emergencyLockdown,
        lockdownMessage: lockdownDraft,
        lockdownEpoch: systemConfig.lockdownEpoch,
        auditAction: nextState ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
        auditDetails: nextState
          ? `Enabled Maintenance Mode. Public notice: "${maintenanceDraft.trim().slice(0, 140)}"`
          : 'Disabled Maintenance Mode. Public portal restored.',
      });
      onNotify(
        nextState
          ? 'Maintenance Mode ENABLED — non-developers now see the Maintenance Page.'
          : 'Maintenance Mode DISABLED — public portal is live.'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to toggle Maintenance Mode.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleLockdown = async (enable: boolean) => {
    setConfirmLockdownOpen(false);
    setBusyAction('lockdown');
    try {
      const nextEpoch = enable ? systemConfig.lockdownEpoch + 1 : systemConfig.lockdownEpoch;
      await updateSystemConfigWithAudit({
        maintenanceMode: systemConfig.maintenanceMode,
        maintenanceMessage: maintenanceDraft,
        emergencyLockdown: enable,
        lockdownMessage: lockdownDraft,
        lockdownEpoch: nextEpoch,
        auditAction: enable ? 'LOCKDOWN_ENABLED' : 'LOCKDOWN_DISABLED',
        auditDetails: enable
          ? `Activated Emergency Read-Only Lockdown (epoch #${nextEpoch}). All non-developer writes/sign-ups blocked and active sessions signed out.`
          : 'Deactivated Emergency Read-Only Lockdown. Normal write access restored.',
      });
      onNotify(
        enable
          ? 'EMERGENCY LOCKDOWN ACTIVE — all non-developer writes blocked and sessions terminated.'
          : 'Emergency Lockdown deactivated — normal operations resumed.'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to toggle Emergency Lockdown.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveSystemMessages = async (e: FormEvent) => {
    e.preventDefault();
    setBusyAction('messages');
    try {
      await updateSystemConfigWithAudit({
        maintenanceMode: systemConfig.maintenanceMode,
        maintenanceMessage: maintenanceDraft,
        emergencyLockdown: systemConfig.emergencyLockdown,
        lockdownMessage: lockdownDraft,
        lockdownEpoch: systemConfig.lockdownEpoch,
        auditAction: 'SYSTEM_CONFIG_UPDATED',
        auditDetails: 'Updated Maintenance / Emergency Lockdown display messages in config/system.',
      });
      onNotify('System status messages saved to Firestore config/system.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save messages.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDirectModerationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim() || targetReason.trim().length < 3) return;
    setBusyAction('direct-mod');
    try {
      await setUserModerationStatusWithAudit({
        email: targetEmail.trim(),
        displayName: targetName.trim(),
        status: targetStatus,
        reason: targetReason.trim(),
      });
      onNotify(`User ${targetEmail.trim().toLowerCase()} marked as ${targetStatus.toUpperCase()}.`);
      setTargetEmail('');
      setTargetName('');
      setTargetReason('');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update user status.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmUserAction = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const reason = actionReason.trim();
    if (reason.length < 3) return;
    setBusyAction('modal-action');
    try {
      if (actionModal.mode === 'revoke_role') {
        await revokeUserRoleWithAudit({
          emailKey: actionModal.user.emailKey,
          email: actionModal.user.email,
          previousRole: actionModal.user.role || 'unknown',
          reason,
        });
        onNotify(`Revoked role from ${actionModal.user.email} and logged audit entry.`);
      } else {
        await setUserModerationStatusWithAudit({
          email: actionModal.user.email,
          displayName: actionModal.user.displayName,
          status: actionModal.mode,
          reason,
        });
        onNotify(
          `Updated ${actionModal.user.email} status to ${actionModal.mode.toUpperCase()}.`
        );
      }
      setActionModal(null);
      setActionReason('');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportAuditJSON = () => {
    const payload = auditLogs.map((l) => ({
      ...l,
      createdAt: l.createdAt ? l.createdAt.toISOString() : null,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UE_Admin_Audit_Log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify('Exported immutable audit log (.json).');
  };

  const handleLogTestError = async () => {
    setBusyAction('test-error');
    try {
      const ok = await logSystemError({
        source: 'admin',
        severity: 'warning',
        message: 'Diagnostic test error triggered manually from /admin Error Log tab.',
        path: '/admin',
        operation: 'diagnostic',
      });
      onNotify(
        ok
          ? 'Diagnostic test error recorded in Firestore error_logs.'
          : 'Error logger throttled (wait 4s before retrying).'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const suspendedCount = unifiedUsers.filter((u) => u.moderationStatus === 'suspended').length;
  const bannedCount = unifiedUsers.filter((u) => u.moderationStatus === 'banned').length;
  const openErrorsCount = errorLogs.filter((e) => !e.resolved).length;

  const canModerateTarget = (u: UnifiedDirectoryUser) => {
    if (u.isMainDeveloper) return false;
    if (u.role === 'developer' && !isMainDeveloper) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100">
      {/* Top Sticky Admin Command Bar */}
      <header className="sticky top-0 z-30 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27] truncate">
              <Terminal className="w-3.5 h-3.5 shrink-0" />
              <span>
                /admin · {isMainDeveloper ? 'Tier 0A Main Developer' : 'Tier 0B Platform Developer'}
              </span>
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#111318] dark:text-white truncate">
              System Administration Console{' '}
              <span className="font-normal text-xs text-[#5A6270] dark:text-slate-400">
                ({currentUser.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenRoleDashboard}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B51B27]" />
              <span>Role Dashboard</span>
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal</span>
            </button>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#111318] text-white dark:bg-slate-800 hover:bg-[#B51B27] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="border-t border-[#E2E5EB] dark:border-[#262B35] bg-white/90 dark:bg-[#15181E]/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                {
                  id: 'system' as AdminTab,
                  label: 'System Controls',
                  icon: Wrench,
                  badge: systemConfig.emergencyLockdown
                    ? 'LOCKDOWN'
                    : systemConfig.maintenanceMode
                    ? 'MAINT'
                    : null,
                },
                {
                  id: 'users' as AdminTab,
                  label: 'User Management',
                  icon: Users,
                  badge:
                    suspendedCount + bannedCount > 0
                      ? String(suspendedCount + bannedCount)
                      : null,
                },
                {
                  id: 'audit' as AdminTab,
                  label: 'Audit Log',
                  icon: ClipboardList,
                  badge: String(auditLogs.length),
                },
                {
                  id: 'errors' as AdminTab,
                  label: 'Error Log',
                  icon: Activity,
                  badge: openErrorsCount > 0 ? String(openErrorsCount) : null,
                },
              ]
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#B51B27] text-white'
                      : 'text-[#5A6270] dark:text-slate-300 hover:text-[#111318] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#B51B27]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI / Live Posture Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-4">
            <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
              Maintenance Mode
            </div>
            <div
              className={`font-display text-lg font-extrabold mt-1 ${
                systemConfig.maintenanceMode
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {systemConfig.maintenanceMode ? 'ACTIVE' : 'OFF (Live)'}
            </div>
            <div className="text-[11px] text-[#5A6270] dark:text-slate-400 mt-0.5 font-mono">
              config/system
            </div>
          </div>

          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-4">
            <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
              Emergency Lockdown
            </div>
            <div
              className={`font-display text-lg font-extrabold mt-1 ${
                systemConfig.emergencyLockdown
                  ? 'text-[#B51B27]'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {systemConfig.emergencyLockdown ? 'LOCKED DOWN' : 'OFF (Writable)'}
            </div>
            <div className="text-[11px] text-[#5A6270] dark:text-slate-400 mt-0.5 font-mono">
              Epoch #{systemConfig.lockdownEpoch}
            </div>
          </div>

          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-4">
            <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
              Moderated Accounts
            </div>
            <div className="font-display text-lg font-extrabold mt-1 text-[#111318] dark:text-white tabular-nums">
              {suspendedCount} Suspended · {bannedCount} Banned
            </div>
            <div className="text-[11px] text-[#5A6270] dark:text-slate-400 mt-0.5 font-mono">
              {portalData.roleAssignments.length} assigned roles
            </div>
          </div>

          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-4">
            <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
              Audit &amp; Error Telemetry
            </div>
            <div className="font-display text-lg font-extrabold mt-1 text-[#111318] dark:text-white tabular-nums">
              {openErrorsCount} Open Errors
            </div>
            <div className="text-[11px] text-[#5A6270] dark:text-slate-400 mt-0.5 font-mono">
              {auditLogs.length} immutable audit records
            </div>
          </div>
        </div>

        {/* ==================== TAB 1: SYSTEM CONTROLS ==================== */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Maintenance Mode Card */}
              <section className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
                      <Wrench className="w-4 h-4" />
                      <span>Firestore: config/system.maintenanceMode</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                        systemConfig.maintenanceMode
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {systemConfig.maintenanceMode ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-[#111318] dark:text-white">
                    Maintenance Mode
                  </h2>
                  <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
                    When turned ON, every public visitor and non-developer account immediately sees
                    the full-screen Maintenance Page. Accounts with{' '}
                    <code className="font-mono font-semibold">role = developer</code> retain full
                    access to both the portal and <code className="font-mono">/admin</code>.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-between gap-4">
                  <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                    Last updated by {systemConfig.updatedByName}
                    {systemConfig.updatedAt ? ` · ${formatDateTime(systemConfig.updatedAt)}` : ''}
                  </div>
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void handleToggleMaintenance()}
                    className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 ${
                      systemConfig.maintenanceMode
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {busyAction === 'maintenance'
                      ? 'Updating...'
                      : systemConfig.maintenanceMode
                      ? 'Disable Maintenance Mode'
                      : 'Enable Maintenance Mode'}
                  </button>
                </div>
              </section>

              {/* Emergency Lockdown Card */}
              <section
                className={`rounded-xl p-6 flex flex-col justify-between gap-5 border ${
                  systemConfig.emergencyLockdown
                    ? 'bg-red-50/70 dark:bg-red-950/20 border-[#B51B27]'
                    : 'bg-white dark:bg-[#15181E] border-[#E2E5EB] dark:border-[#262B35]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Firestore: config/system.emergencyLockdown</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                        systemConfig.emergencyLockdown
                          ? 'bg-[#B51B27] text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {systemConfig.emergencyLockdown ? 'LOCKDOWN ON' : 'OFF'}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-[#111318] dark:text-white">
                    Emergency Read-Only Lockdown
                  </h2>
                  <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
                    Enforces strict read-only posture across both UI and Firestore security rules:
                    blocks all new sign-ups, CSV/form uploads, and every non-developer write across
                    all collections, and immediately signs out all other active users.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-between gap-4">
                  <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                    Enforced in Firestore rules + live session guard
                  </div>
                  {systemConfig.emergencyLockdown ? (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => void handleToggleLockdown(false)}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      {busyAction === 'lockdown' ? 'Lifting...' : 'Lift Emergency Lockdown'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => setConfirmLockdownOpen(true)}
                      className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#B51B27] hover:bg-[#92141E] text-white transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      Activate Emergency Lockdown
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Editable Public Notice Messages */}
            <form
              onSubmit={handleSaveSystemMessages}
              className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4"
            >
              <div>
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  System Notice Messages (config/system)
                </h3>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                  Customize the notices shown to non-developers when Maintenance Mode or Emergency
                  Lockdown is active.
                </p>
              </div>
              <div className="grid lg:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    Maintenance Page Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    maxLength={500}
                    value={maintenanceDraft}
                    onChange={(e) => setMaintenanceDraft(e.target.value)}
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    Emergency Lockdown Banner Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    maxLength={500}
                    value={lockdownDraft}
                    onChange={(e) => setLockdownDraft(e.target.value)}
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyAction !== null}
                  className="bg-[#111318] dark:bg-[#B51B27] hover:bg-[#B51B27] dark:hover:bg-[#92141E] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {busyAction === 'messages' ? 'Saving...' : 'Save Messages to config/system'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== TAB 2: USER MANAGEMENT ==================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Direct Suspend / Ban Form */}
            <form
              onSubmit={handleDirectModerationSubmit}
              className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4"
            >
              <div>
                <h2 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  Direct User Moderation (Suspend / Ban / Restore by Email)
                </h2>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                  Immediately suspends or bans any Google email account, blocks all Firestore
                  writes, and signs out active sessions in real time. Every action is logged to{' '}
                  <code className="font-mono">audit_logs</code>.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    User Email
                  </label>
                  <input
                    type="email"
                    required
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    Action
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as UserModerationStatus)}
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                  >
                    <option value="suspended">Suspend Account</option>
                    <option value="banned">Ban Account Permanently</option>
                    <option value="active">Restore Active Access</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                    Audit Reason (Required)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={500}
                    value={targetReason}
                    onChange={(e) => setTargetReason(e.target.value)}
                    placeholder="e.g., Policy violation / spam submissions"
                    className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyAction !== null}
                  className="bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  {busyAction === 'direct-mod' ? 'Applying...' : 'Apply User Moderation'}
                </button>
              </div>
            </form>

            {/* Unified User Directory */}
            <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
                    Directory &amp; Role Control ({filteredUsers.length})
                  </h3>
                  <p className="text-xs text-[#5A6270] dark:text-slate-400">
                    Suspend, ban, restore, or revoke roles for assigned personnel, applicants, and
                    registrants.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#5A6270] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search email, name, role..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg"
                    />
                  </div>
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'roles', label: 'Assigned Roles' },
                      { id: 'suspended', label: 'Suspended' },
                      { id: 'banned', label: 'Banned' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUserFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        userFilter === f.id
                          ? 'bg-[#111318] dark:bg-[#B51B27] text-white border-transparent'
                          : 'border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] dark:text-slate-300 hover:border-[#B51B27]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-xs text-[#5A6270] dark:text-slate-400 py-6 text-center">
                  No matching user records found.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                  {filteredUsers.map((u) => {
                    const allowed = canModerateTarget(u);
                    return (
                      <div
                        key={u.emailKey}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-[#111318] dark:text-white">
                              {u.displayName}
                            </span>
                            <span className="font-mono text-[#5A6270] dark:text-slate-400">
                              ({u.email})
                            </span>
                            {u.moderationStatus === 'banned' && (
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">
                                BANNED
                              </span>
                            )}
                            {u.moderationStatus === 'suspended' && (
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                                SUSPENDED
                              </span>
                            )}
                            {u.isMainDeveloper && (
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#111318] text-white">
                                PERMANENT ROOT
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-[#5A6270] dark:text-slate-400">
                            {u.role ? ROLE_LABELS[u.role] : `No Assigned Role (${u.sourceLabel})`}
                            {u.campus ? ` · ${u.campus}` : ''}
                            {u.caCode ? ` · ${u.caCode}` : ''}
                          </div>
                          {u.moderationStatus !== 'active' && u.moderationReason && (
                            <div className="text-[11px] text-[#B51B27] dark:text-red-300">
                              Moderation Reason: {u.moderationReason}
                              {u.moderationUpdatedAt
                                ? ` (${formatDateTime(u.moderationUpdatedAt)})`
                                : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {!allowed ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#5A6270] dark:text-slate-400">
                              <Lock className="w-3 h-3" />
                              <span>Protected</span>
                            </span>
                          ) : (
                            <>
                              {u.moderationStatus === 'active' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionReason('');
                                      setActionModal({ user: u, mode: 'suspended' });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold cursor-pointer"
                                  >
                                    <ShieldOff className="w-3.5 h-3.5" />
                                    <span>Suspend</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionReason('');
                                      setActionModal({ user: u, mode: 'banned' });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-300 dark:border-red-900 text-[#B51B27] dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>Ban</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionReason('Account reviewed and reinstated');
                                    setActionModal({ user: u, mode: 'active' });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                              )}

                              {u.role && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionReason('');
                                    setActionModal({ user: u, mode: 'revoke_role' });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] hover:text-[#B51B27] font-semibold cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span>Revoke Role</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: IMMUTABLE AUDIT LOG ==================== */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  Immutable Admin Audit Log ({filteredAuditLogs.length})
                </h2>
                <p className="text-xs text-[#5A6270] dark:text-slate-400">
                  Append-only Firestore trail recording who performed every admin action, what
                  changed, and when. Updates and deletions are blocked in Firestore rules.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportAuditJSON}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#5A6270] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter by actor, target, action, or details..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg"
                />
              </div>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'system', label: 'System' },
                  { id: 'users', label: 'Users' },
                  { id: 'roles', label: 'Roles' },
                  { id: 'errors', label: 'Errors' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAuditCategory(c.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    auditCategory === c.id
                      ? 'bg-[#111318] dark:bg-[#B51B27] text-white border-transparent'
                      : 'border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] dark:text-slate-300 hover:border-[#B51B27]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {filteredAuditLogs.length === 0 ? (
              <p className="text-xs text-[#5A6270] dark:text-slate-400 py-8 text-center">
                No audit entries recorded yet. Every toggle, suspension, ban, or role revocation
                will appear here automatically.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E5EB] dark:border-[#262B35] font-mono text-[11px] text-[#5A6270] dark:text-slate-400">
                      <th className="py-2.5 pr-4">When</th>
                      <th className="py-2.5 pr-4">Who</th>
                      <th className="py-2.5 pr-4">What</th>
                      <th className="py-2.5 pr-4">Target</th>
                      <th className="py-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5EB] dark:divide-[#262B35]">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="align-top">
                        <td className="py-3 pr-4 font-mono text-[11px] text-[#5A6270] dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <div className="font-semibold text-[#111318] dark:text-white">
                            {log.actorName}
                          </div>
                          <div className="font-mono text-[11px] text-[#5A6270] dark:text-slate-400">
                            {log.actorEmail}
                          </div>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] text-[#B51B27]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-[11px] text-[#111318] dark:text-slate-200 whitespace-nowrap">
                          {log.target}
                        </td>
                        <td className="py-3 text-[#5A6270] dark:text-slate-300 leading-relaxed min-w-[240px]">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: ERROR LOG ==================== */}
        {activeTab === 'errors' && (
          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  Application &amp; Firestore Error Log ({filteredErrorLogs.length})
                </h2>
                <p className="text-xs text-[#5A6270] dark:text-slate-400">
                  Captures Firestore permission/operation failures, React ErrorBoundary crashes,
                  and unhandled runtime exceptions in real time.
                </p>
              </div>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleLogTestError()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer shrink-0 disabled:opacity-60"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Log Test Error</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'open', label: `Open (${openErrorsCount})` },
                  { id: 'resolved', label: `Resolved (${errorLogs.length - openErrorsCount})` },
                  { id: 'all', label: `All (${errorLogs.length})` },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setErrorStatusFilter(s.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    errorStatusFilter === s.id
                      ? 'bg-[#111318] dark:bg-[#B51B27] text-white border-transparent'
                      : 'border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] dark:text-slate-300 hover:border-[#B51B27]'
                  }`}
                >
                  {s.label}
                </button>
              ))}

              <select
                aria-label="Filter by error source"
                value={errorSourceFilter}
                onChange={(e) => setErrorSourceFilter(e.target.value)}
                className="ml-auto text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-2.5 py-1.5"
              >
                <option value="all">All Sources</option>
                <option value="firestore">Firestore</option>
                <option value="runtime">Runtime</option>
                <option value="unhandled_rejection">Unhandled Rejection</option>
                <option value="ui_boundary">UI Boundary</option>
                <option value="auth">Auth</option>
                <option value="admin">Admin Diagnostic</option>
              </select>
            </div>

            {filteredErrorLogs.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="text-xs text-[#5A6270] dark:text-slate-400">
                  No matching errors in this view.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                {filteredErrorLogs.map((err) => (
                  <div
                    key={err.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span
                          className={`font-bold px-2 py-0.5 rounded uppercase ${
                            err.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'
                              : err.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {err.severity}
                        </span>
                        <span className="text-[#B51B27] font-semibold">{err.source}</span>
                        <span className="text-[#5A6270] dark:text-slate-400">
                          {err.operation} · {err.path}
                        </span>
                        <span className="text-[#5A6270] dark:text-slate-400">
                          · {formatDateTime(err.createdAt)}
                        </span>
                        {err.resolved && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            [RESOLVED]
                          </span>
                        )}
                      </div>
                      <p className="text-[#111318] dark:text-slate-100 font-mono text-xs break-words">
                        {err.message}
                      </p>
                      <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                        User: {err.userEmail || 'unknown'} ({err.userUid})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          void toggleErrorLogResolvedWithAudit(
                            err.id,
                            !err.resolved,
                            err.message.slice(0, 120)
                          ).then(() =>
                            onNotify(err.resolved ? 'Error reopened.' : 'Error marked resolved.')
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 hover:border-[#B51B27] font-semibold cursor-pointer"
                      >
                        {err.resolved ? 'Reopen' : 'Mark Resolved'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void deleteErrorLogWithAudit(err.id, err.message.slice(0, 120)).then(
                            () => onNotify('Error log deleted and recorded in audit log.')
                          )
                        }
                        aria-label="Delete error entry"
                        className="p-1.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] hover:text-[#B51B27] hover:border-[#B51B27] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Emergency Lockdown Confirmation Dialog */}
      {confirmLockdownOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#15181E] border border-[#B51B27] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#B51B27]">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="font-display text-base font-extrabold text-[#111318] dark:text-white">
                Confirm Emergency Read-Only Lockdown
              </h3>
            </div>
            <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
              Activating Emergency Lockdown immediately puts the entire portal into read-only mode,
              blocks all sign-ups, uploads, and Firestore writes for non-developers, and signs out
              every active non-developer user. Developers retain full <code className="font-mono">/admin</code>{' '}
              access.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLockdownOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-xs font-semibold text-[#111318] dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void handleToggleLockdown(true)}
                className="px-4 py-2 rounded-lg bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold cursor-pointer"
              >
                Activate Lockdown Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Moderation / Revoke Role Confirmation Dialog */}
      {actionModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmUserAction}
            className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
          >
            <div>
              <div className="font-mono text-[11px] font-semibold text-[#B51B27] uppercase">
                {actionModal.mode === 'revoke_role'
                  ? 'Revoke Role Assignment'
                  : actionModal.mode === 'banned'
                  ? 'Permanent Account Ban'
                  : actionModal.mode === 'suspended'
                  ? 'Temporary Account Suspension'
                  : 'Restore Account Access'}
              </div>
              <h3 className="font-display text-base font-extrabold text-[#111318] dark:text-white mt-0.5">
                {actionModal.user.displayName} ({actionModal.user.email})
              </h3>
            </div>

            <div>
              <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                Reason for Audit Log (Required)
              </label>
              <textarea
                rows={3}
                required
                minLength={3}
                maxLength={500}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Describe why this action is being taken..."
                className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] font-semibold text-[#111318] dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAction !== null || actionReason.trim().length < 3}
                className={`px-4 py-2 rounded-lg text-white font-semibold cursor-pointer disabled:opacity-60 ${
                  actionModal.mode === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#B51B27] hover:bg-[#92141E]'
                }`}
              >
                {busyAction === 'modal-action' ? 'Processing...' : 'Confirm & Log Action'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
