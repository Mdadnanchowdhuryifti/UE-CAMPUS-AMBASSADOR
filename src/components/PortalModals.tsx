import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Crown,
  Lock,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { RECRUITMENT_ROLE_ITEMS } from '../data/playbook';
import {
  getFirstOpenRecruitmentRoleTitle,
  hasAnyOpenRecruitmentRole,
  isRoleOpenForRecruitment,
} from '../services/portalService';
import {
  AuthSignInMode,
  KpiWeights,
  PortalUser,
  RecruitmentStatusMap,
  SquadName,
  Workshop,
} from '../types';

interface AuthModalProps {
  open: boolean;
  initialMode?: AuthSignInMode;
  signingIn: boolean;
  authError: string | null;
  onClearError: () => void;
  onClose: () => void;
  onGoogleSignIn: (intent?: AuthSignInMode, emailHint?: string) => Promise<void>;
}

export function AuthModal({
  open,
  initialMode = 'standard',
  signingIn,
  authError,
  onClearError,
  onClose,
  onGoogleSignIn,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthSignInMode>(initialMode);
  const [execEmailHint, setExecEmailHint] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleTabSwitch = (nextMode: AuthSignInMode) => {
    setMode(nextMode);
    onClearError();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              {mode === 'developer'
                ? 'Tier 0 · Main Developer Root Auth'
                : mode === 'executive'
                ? 'Tier 1 · Chair & Company CEO Auth'
                : 'Personal Verified Sign In'}
            </div>
            <h3
              id="auth-modal-title"
              className="font-display text-lg font-extrabold text-[#111318] dark:text-white"
            >
              Ulterior Engineering Role-Locked Portal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Mode Segmented Switcher: ExCom & CA | Chair & CEO | Developer Root */}
        <div
          role="tablist"
          aria-label="Sign in mode"
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'standard'}
            onClick={() => handleTabSwitch('standard')}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'standard'
                ? 'bg-white dark:bg-[#15181E] text-[#111318] dark:text-white shadow-sm'
                : 'text-[#5A6270] dark:text-slate-400 hover:text-[#111318] dark:hover:text-white'
            }`}
          >
            ExCom &amp; CA
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'executive'}
            onClick={() => handleTabSwitch('executive')}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'executive'
                ? 'bg-[#B51B27] text-white shadow-sm'
                : 'text-[#5A6270] dark:text-slate-400 hover:text-[#111318] dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>Chair &amp; CEO</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'developer'}
            onClick={() => handleTabSwitch('developer')}
            className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1 cursor-pointer ${
              mode === 'developer'
                ? 'bg-[#111318] text-white shadow-sm'
                : 'text-[#5A6270] dark:text-slate-400 hover:text-[#111318] dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#B51B27] shrink-0" />
            <span>Developer</span>
          </button>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {mode === 'developer' ? (
          <div className="space-y-4">
            <div className="bg-[#111318] text-white rounded-xl p-5 border border-[#262B35] space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
                <Terminal className="w-4 h-4" />
                <span>Tier 0 · Locked Main Developer Access</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Strictly restricted to the two verified{' '}
                <strong className="text-white">Main Developer</strong> accounts or secondary
                Developers explicitly provisioned by them. Any other email is automatically
                rejected.
              </p>
              <ul className="text-[11px] font-mono text-slate-400 space-y-1.5 pt-1">
                <li>• Only the 2 Main Developers can add or revoke Developer accounts</li>
                <li>• Appoint or revoke Program Chair &amp; Company CEO emails</li>
                <li>• Control recruitment open/close switches &amp; full site governance</li>
              </ul>
            </div>

            <button
              type="button"
              disabled={signingIn}
              onClick={() => void onGoogleSignIn('developer')}
              className="w-full inline-flex items-center justify-center gap-3 bg-[#111318] hover:bg-[#B51B27] disabled:opacity-60 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>
                {signingIn
                  ? 'Verifying Developer Clearance...'
                  : 'Sign In to Developer Mode (Google)'}
              </span>
            </button>
          </div>
        ) : mode === 'executive' ? (
          <div className="space-y-4">
            <div className="bg-[#F4F5F7] dark:bg-[#0D0F12] rounded-xl p-5 border border-[#E2E5EB] dark:border-[#262B35] space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
                <Crown className="w-4 h-4" />
                <span>Tier 1 · Program Chair &amp; Company CEO</span>
              </div>
              <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
                Dedicated executive gateway for the Developer-appointed{' '}
                <strong className="text-[#111318] dark:text-white">Program Chair</strong> and{' '}
                <strong className="text-[#111318] dark:text-white">Company CEO</strong>. Both hold
                full operational Chair access, including opening/closing recruitment for Secretary,
                Core Team Leads 1–5, and General CAs.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onGoogleSignIn('executive', execEmailHint.trim() || undefined);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                  Authorized Chair / Company CEO Email{' '}
                  <span className="font-normal text-[#5A6270] dark:text-slate-400">
                    (Optional account pre-fill)
                  </span>
                </label>
                <input
                  type="email"
                  value={execEmailHint}
                  onChange={(e) => setExecEmailHint(e.target.value)}
                  placeholder="chair.or.ceo@gmail.com"
                  className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                />
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>
                  {signingIn
                    ? 'Verifying Chair / CEO Email...'
                    : 'Sign In as Chair or Company CEO (Google)'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
              Sign in with your personal Google account. Only authorized{' '}
              <strong className="text-[#111318] dark:text-white">Developers</strong>,{' '}
              <strong className="text-[#111318] dark:text-white">Program Chair</strong>, and{' '}
              <strong className="text-[#111318] dark:text-white">Company CEO</strong> have
              full-site operational access. Every other role is strictly locked to its segment:
            </p>

            <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs border border-[#E2E5EB] dark:border-[#262B35] rounded-xl px-4">
              <div className="py-3 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#111318] dark:text-white">
                    Tier 1 · Program Chair &amp; Company CEO (Full Operational Access)
                  </div>
                  <div className="text-[#5A6270] dark:text-slate-400">
                    Full executive access to recruitment switches, KPI weights, certificates,
                    ExCom hubs, Leads 1–5, and subordinate role management.
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#5A6270] dark:text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#111318] dark:text-white">
                    Tier 2 · Program Secretary (Secretary Segment Only)
                  </div>
                  <div className="text-[#5A6270] dark:text-slate-400">
                    Dedicated access to cross-squad KPI audits, central campaign broadcasts, and
                    Chair sync exports.
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#5A6270] dark:text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#111318] dark:text-white">
                    Tier 3 · Core Team Leads 1–5 (Particular Lead Segment Only)
                  </div>
                  <div className="text-[#5A6270] dark:text-slate-400">
                    Each Lead accesses strictly their own portfolio (Ops, Growth, Tech Leads, Brand,
                    or Clubs) and assigned Squad (A–E).
                  </div>
                </div>
              </div>

              <div className="py-3 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#5A6270] dark:text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#111318] dark:text-white">
                    Tier 4 · General Campus Ambassador (Personal Dashboard Only)
                  </div>
                  <div className="text-[#5A6270] dark:text-slate-400">
                    Personal referral link, verified scorecards, proof submissions, and campaign
                    kits.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={signingIn}
              onClick={() => void onGoogleSignIn('standard')}
              className="w-full inline-flex items-center justify-center gap-3 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-sm font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.74 4.35-5.27 4.35-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 4.1 14.69 3.2 12.17 3.2 7.21 3.2 3.2 7.21 3.2 12.17s4.01 8.97 8.97 8.97c5.18 0 8.61-3.64 8.61-8.77 0-.59-.06-1.04-.14-1.27z"
                />
              </svg>
              <span>{signingIn ? 'Verifying Google Account...' : 'Continue with Google'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface ApplyModalProps {
  open: boolean;
  defaultRole: string;
  defaultSquad: SquadName;
  recruitmentStatus: RecruitmentStatusMap;
  currentUser: PortalUser | null;
  onRequireSignIn: () => Promise<void>;
  onClose: () => void;
  onSubmit: (app: {
    role: string;
    name: string;
    campus: string;
    squad: SquadName;
    email: string;
    exp: string;
  }) => Promise<void>;
}

export function ApplyModal({
  open,
  defaultRole,
  defaultSquad,
  recruitmentStatus,
  currentUser,
  onRequireSignIn,
  onClose,
  onSubmit,
}: ApplyModalProps) {
  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [squad, setSquad] = useState<SquadName>(defaultSquad);
  const [exp, setExp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const anyOpen = hasAnyOpenRecruitmentRole(recruitmentStatus);
  const selectedRoleOpen = isRoleOpenForRecruitment(recruitmentStatus, role);

  useEffect(() => {
    if (open) {
      const nextRole = isRoleOpenForRecruitment(recruitmentStatus, defaultRole)
        ? defaultRole
        : getFirstOpenRecruitmentRoleTitle(recruitmentStatus) || defaultRole;
      setRole(nextRole);
      setSquad(defaultSquad);
      if (currentUser?.displayName && !name) {
        setName(currentUser.displayName);
      }
    }
  }, [open, defaultRole, defaultSquad, currentUser, recruitmentStatus]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!anyOpen || !selectedRoleOpen) return;
    if (!currentUser) {
      await onRequireSignIn();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        role,
        name: name.trim(),
        campus: campus.trim(),
        squad,
        email: currentUser.email,
        exp: exp.trim(),
      });
      setCampus('');
      setExp('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3 mb-4">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              Call for Applications · 2026–2027
            </div>
            <h3
              id="apply-modal-title"
              className="font-display text-lg font-extrabold text-[#111318] dark:text-white"
            >
              Ulterior Engineering CA Recruitment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application modal"
            className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!anyOpen ? (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-4 rounded-xl bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[#111318] dark:text-white">
                  Recruitment Cycle Currently Closed
                </div>
                <p className="text-[#5A6270] dark:text-slate-400 leading-relaxed">
                  Applications for Program Secretary, Core Team Leads 1–5, and General Campus
                  Ambassadors have been closed by Ulterior Engineering leadership. Please check
                  back for the next recruitment window.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] font-semibold text-[#111318] dark:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                Applying For (Tier / Role)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
              >
                {RECRUITMENT_ROLE_ITEMS.map((item) => {
                  const isOpen = recruitmentStatus[item.key];
                  return (
                    <option
                      key={item.key}
                      value={item.roleTitle}
                      disabled={!isOpen}
                    >
                      {item.tierLabel.split('·')[0].trim()} · {item.roleTitle} ({item.squadLabel})
                      {!isOpen ? ' — Recruitment Closed' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {!selectedRoleOpen && (
              <div className="p-3 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] text-[#5A6270] dark:text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#B51B27] shrink-0" />
                <span>Recruitment for this position is currently closed. Select an open position above.</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                  University / Institute
                </label>
                <input
                  type="text"
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  placeholder="e.g., NSU, BUET, CUET"
                  className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                  Target Squad Cluster
                </label>
                <select
                  value={squad}
                  onChange={(e) => setSquad(e.target.value as SquadName)}
                  className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                >
                  <option value="Squad A">Squad A · Dhaka Zone A (Private)</option>
                  <option value="Squad B">Squad B · Dhaka Zone B (Central/Public)</option>
                  <option value="Squad C">Squad C · Engineering &amp; Tech Hub</option>
                  <option value="Squad D">Squad D · Regional General Univ</option>
                  <option value="Squad E">Squad E · Polytechnic &amp; Emerging</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                  Verified Account Email
                </label>
                <input
                  type="email"
                  readOnly
                  value={currentUser ? currentUser.email : 'Sign in with Google below'}
                  className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#5A6270] dark:text-slate-400 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                Prior Club / Leadership Experience &amp; Month-1 Plan
              </label>
              <textarea
                rows={3}
                required
                minLength={5}
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="Mention IEEE, Robotics, EEE/CSE club leadership and how you would grow Ulterior Engineering on campus..."
                className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedRoleOpen}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#B51B27] hover:bg-[#92141E] disabled:bg-[#E2E5EB] dark:disabled:bg-[#1E222B] disabled:text-[#5A6270] disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {!selectedRoleOpen ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Recruitment Closed for Selected Role</span>
                </>
              ) : currentUser ? (
                <span>
                  {submitting
                    ? 'Saving Application...'
                    : 'Submit Application to Chair, CEO & Secretary'}
                </span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign in with Google to Submit Application</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

interface WorkshopModalProps {
  workshop: Workshop | null;
  defaultRefCode: string;
  currentUser: PortalUser | null;
  onRequireSignIn: () => Promise<void>;
  onClose: () => void;
  onSubmit: (reg: {
    workshopId: string;
    workshopTitle: string;
    participantName: string;
    university: string;
    email: string;
    refCode: string;
  }) => Promise<void>;
}

export function WorkshopModal({
  workshop,
  defaultRefCode,
  currentUser,
  onRequireSignIn,
  onClose,
  onSubmit,
}: WorkshopModalProps) {
  const [name, setName] = useState('');
  const [univ, setUniv] = useState('');
  const [refCode, setRefCode] = useState(defaultRefCode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (workshop) {
      setRefCode(defaultRefCode);
      if (currentUser?.displayName && !name) {
        setName(currentUser.displayName);
      }
    }
  }, [workshop, defaultRefCode, currentUser]);

  if (!workshop) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await onRequireSignIn();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        workshopId: workshop.id,
        workshopTitle: workshop.title,
        participantName: name.trim(),
        university: univ.trim(),
        email: currentUser.email,
        refCode: refCode.trim().toUpperCase(),
      });
      setUniv('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ws-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-md w-full p-6">
        <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3 mb-4">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              Workshop Registration
            </div>
            <h3
              id="ws-modal-title"
              className="font-display text-base font-extrabold text-[#111318] dark:text-white"
            >
              {workshop.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close workshop registration dialog"
            className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
              Participant Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
              University / Department
            </label>
            <input
              type="text"
              required
              value={univ}
              onChange={(e) => setUniv(e.target.value)}
              placeholder="e.g., NSU — EEE"
              className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
              CA Referral Code{' '}
              <span className="font-normal text-[#5A6270] dark:text-slate-400">
                (Optional — Auto-filled from link)
              </span>
            </label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g., UE-A101"
              className="w-full font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            {currentUser ? (
              <span>{submitting ? 'Confirming...' : 'Confirm Registration'}</span>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in with Google to Register</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface SheetSyncModalProps {
  open: boolean;
  canSync: boolean;
  onClose: () => void;
  onSync: (url: string) => Promise<void>;
}

export function SheetSyncModal({
  open,
  canSync,
  onClose,
  onSync,
}: SheetSyncModalProps) {
  const [url, setUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !canSync) return;
    setSyncing(true);
    try {
      await onSync(url.trim());
      setUrl('');
      onClose();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-sync-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3 mb-4">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              Cloud Roster Sync
            </div>
            <h3
              id="sheet-sync-title"
              className="font-display text-base font-extrabold text-[#111318] dark:text-white"
            >
              Sync Leaderboard from Google Sheets (CSV)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Google Sheets sync dialog"
            className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canSync ? (
          <div className="space-y-4 text-xs text-[#5A6270] dark:text-slate-300">
            <p>
              Only the signed-in <strong>Platform Developer</strong>,{' '}
              <strong>Program Chair</strong>, or <strong>Lead 1 (Operations &amp; CA HR)</strong>{' '}
              can bulk-import Google Sheets CSV records into the live Cloud Firestore roster.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] font-semibold text-[#111318] dark:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#5A6270] dark:text-slate-400 leading-relaxed mb-3">
              In Google Sheets, click{' '}
              <strong className="text-[#111318] dark:text-slate-200">
                File → Share → Publish to web → Comma-separated values (.csv)
              </strong>
              . Expected columns:
              <code className="block mt-2 p-2.5 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-200 font-mono text-[11px] overflow-x-auto">
                Name,Campus,Squad,ReferralCode,WorkshopRegs,TechLeads,BrandPosts,Status
              </code>
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                className="w-full font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  {syncing ? 'Syncing to Cloud...' : 'Fetch & Sync to Firestore'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

interface PlaybookGuideDrawerProps {
  open: boolean;
  kpiWeights: KpiWeights;
  onClose: () => void;
}

export function PlaybookGuideDrawer({
  open,
  kpiWeights,
  onClose,
}: PlaybookGuideDrawerProps) {
  const [selectedTopic, setSelectedTopic] = useState<
    'hierarchy' | 'access' | 'kpi' | 'referral'
  >('hierarchy');

  if (!open) return null;

  const topics: {
    id: 'hierarchy' | 'access' | 'kpi' | 'referral';
    label: string;
    title: string;
    body: string;
  }[] = [
    {
      id: 'hierarchy',
      label: '4-Tier Structure',
      title: '4-Tier Governance Hierarchy',
      body: '1. Program Chair interfaces with Ulterior Engineering Management and holds full portal authority. 2. Program Secretary coordinates all 5 Core Team Leads, audits KPIs, and runs ExCom syncs. 3. Five Core Team Leads own functional portfolios and lead Squads A–E. 4. General CAs execute campaigns on their home campuses.',
    },
    {
      id: 'access',
      label: 'Personal Access',
      title: 'Main Developer Lock & Executive Governance',
      body: 'Only the two verified Main Developers hold permanent Tier 0 Root authority and can add or revoke Developers. Developers appoint the Program Chair and Company CEO, who share full operational Chair access (including opening/closing recruitment toggles). Secretary, Core Leads 1–5, and General CAs remain locked to their own segments.',
    },
    {
      id: 'kpi',
      label: 'KPI Points',
      title: 'Current Monthly KPI Point Weights',
      body: `Workshop Registration: +${kpiWeights.workshopReg} pts · Verified FYDP / Tech Lead: +${kpiWeights.techLead} pts · Brand Post: +${kpiWeights.brandPost} pts · Club Event: +${kpiWeights.clubEvent} pts. Ambassadors who reach ${kpiWeights.certThreshold} points qualify for an official LinkedIn-verifiable certificate.`,
    },
    {
      id: 'referral',
      label: 'Referral Links',
      title: 'Automated Referral Attribution',
      body: 'Every General CA receives a personal URL formatted as ?ref=CODE inside their personal Tier 4 Dashboard. When a student registers for a workshop through that link, the referral code auto-fills and enters the Core Lead and Secretary approval queue.',
    },
  ];

  const active = topics.find((t) => t.id === selectedTopic) || topics[0];

  return (
    <div
      role="dialog"
      aria-label="UE CA Playbook Reference Guide"
      className="fixed bottom-16 right-4 z-50 w-[92vw] max-w-sm bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-[#111318] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#B51B27]" />
          <div>
            <div className="text-xs font-bold">UE CA Playbook Guide</div>
            <div className="text-[11px] font-mono text-slate-400">
              4-Tier Governance &amp; Security Reference
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close playbook guide"
          className="text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTopic(t.id)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                selectedTopic === t.id
                  ? 'bg-[#B51B27] text-white border-[#B51B27]'
                  : 'bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-200 border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-[#E2E5EB] dark:border-[#262B35]">
          <h4 className="font-display font-bold text-sm text-[#111318] dark:text-white">
            {active.title}
          </h4>
          <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
            {active.body}
          </p>
        </div>
      </div>
    </div>
  );
}
