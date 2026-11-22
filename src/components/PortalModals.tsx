import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { KpiWeights, SquadName, UserRole, Workshop } from '../types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onDemoLogin: (role: UserRole) => void;
  onCodeLogin: (code: string) => void;
}

export function AuthModal({
  open,
  onClose,
  onDemoLogin,
  onCodeLogin,
}: AuthModalProps) {
  const [code, setCode] = useState('');
  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onCodeLogin(code.trim());
    setCode('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3 mb-4">
          <div>
            <div className="text-xs font-mono font-semibold text-[#B51B27]">
              Role-Based Portal Access
            </div>
            <h3
              id="auth-modal-title"
              className="font-display text-lg font-extrabold text-[#111318] dark:text-white"
            >
              Sign In to CA / ExCom Dashboard
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

        <p className="text-xs text-[#5A6270] dark:text-slate-400 mb-4 leading-relaxed">
          Select an instant role preview across all 4 tiers to inspect the full workflow, or sign
          in using a registered ambassador referral code.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => onDemoLogin('chair')}
            className="text-left p-4 rounded-xl border border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27] bg-[#F4F5F7]/70 dark:bg-[#0D0F12] transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-[#B51B27] font-semibold">
              Tier 1 · Super Admin
            </div>
            <div className="font-display font-bold text-sm mt-1 text-[#111318] dark:text-white">
              Program Chair
            </div>
            <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
              Approvals, Certificates, KPI Config, Workshops
            </div>
          </button>

          <button
            type="button"
            onClick={() => onDemoLogin('secretary')}
            className="text-left p-4 rounded-xl border border-[#B51B27]/40 hover:border-[#B51B27] bg-[#B51B27]/[0.04] transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-[#B51B27] font-semibold">
              Tier 2 · Executive Ops
            </div>
            <div className="font-display font-bold text-sm mt-1 text-[#111318] dark:text-white">
              Program Secretary
            </div>
            <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
              Cross-Squad Audits, Broadcasts, CSV Export
            </div>
          </button>

          <button
            type="button"
            onClick={() => onDemoLogin('lead')}
            className="text-left p-4 rounded-xl border border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27] bg-[#F4F5F7]/70 dark:bg-[#0D0F12] transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-[#B51B27] font-semibold">
              Tier 3 · Squad ExCom
            </div>
            <div className="font-display font-bold text-sm mt-1 text-[#111318] dark:text-white">
              Core Team Lead
            </div>
            <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
              KPI Approval Queue, Tech Lead Pipeline, Squad A
            </div>
          </button>

          <button
            type="button"
            onClick={() => onDemoLogin('ca')}
            className="text-left p-4 rounded-xl border border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27] bg-[#F4F5F7]/70 dark:bg-[#0D0F12] transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-[#B51B27] font-semibold">
              Tier 4 · Ambassador
            </div>
            <div className="font-display font-bold text-sm mt-1 text-[#111318] dark:text-white">
              General CA
            </div>
            <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
              Referral Link, Submit Proof &amp; Leads, Brand Kits
            </div>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] space-y-2.5"
        >
          <label
            htmlFor="roster-code-input"
            className="block text-xs font-mono text-[#5A6270] dark:text-slate-400"
          >
            Or Sign In with Ambassador Referral Code
          </label>
          <div className="flex gap-2">
            <input
              id="roster-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., UE-A101 or UE-B204"
              required
              className="flex-1 text-xs font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2 focus:outline-none focus:border-[#B51B27]"
            />
            <button
              type="submit"
              className="bg-[#111318] dark:bg-white text-white dark:text-[#111318] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#B51B27] dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ApplyModalProps {
  open: boolean;
  defaultRole: string;
  defaultSquad: SquadName;
  onClose: () => void;
  onSubmit: (app: {
    role: string;
    name: string;
    campus: string;
    squad: SquadName;
    email: string;
    exp: string;
  }) => void;
}

export function ApplyModal({
  open,
  defaultRole,
  defaultSquad,
  onClose,
  onSubmit,
}: ApplyModalProps) {
  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [squad, setSquad] = useState<SquadName>(defaultSquad);
  const [email, setEmail] = useState('');
  const [exp, setExp] = useState('');

  useEffect(() => {
    if (open) {
      setRole(defaultRole);
      setSquad(defaultSquad);
    }
  }, [open, defaultRole, defaultSquad]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      role,
      name: name.trim(),
      campus: campus.trim(),
      squad,
      email: email.trim(),
      exp: exp.trim(),
    });
    setName('');
    setCampus('');
    setEmail('');
    setExp('');
    onClose();
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
              <option value="Program Secretary">Tier 2 · Program Secretary</option>
              <option value="Operations & CA HR Lead">
                Tier 3 · Operations &amp; CA HR Lead (Squad A)
              </option>
              <option value="Workshop & Course Growth Lead">
                Tier 3 · Workshop &amp; Course Growth Lead (Squad B)
              </option>
              <option value="Technical Project & Lead-Gen Lead">
                Tier 3 · Technical Project &amp; Lead-Gen Lead (Squad C)
              </option>
              <option value="Brand & Digital Publicity Lead">
                Tier 3 · Brand &amp; Digital Publicity Lead (Squad D)
              </option>
              <option value="Campus Partnerships & Events Lead">
                Tier 3 · Campus Partnerships &amp; Events Lead (Squad E)
              </option>
              <option value="General Campus Ambassador">
                Tier 4 · General Campus Ambassador
              </option>
            </select>
          </div>

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
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
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
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              placeholder="Mention IEEE, Robotics, EEE/CSE club leadership and how you would grow Ulterior Engineering on campus..."
              className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Submit Application to Program Chair &amp; Secretary
          </button>
        </form>
      </div>
    </div>
  );
}

interface WorkshopModalProps {
  workshop: Workshop | null;
  defaultRefCode: string;
  onClose: () => void;
  onSubmit: (reg: {
    workshopId: string;
    name: string;
    univ: string;
    email: string;
    refCode: string;
  }) => void;
}

export function WorkshopModal({
  workshop,
  defaultRefCode,
  onClose,
  onSubmit,
}: WorkshopModalProps) {
  const [name, setName] = useState('');
  const [univ, setUniv] = useState('');
  const [email, setEmail] = useState('');
  const [refCode, setRefCode] = useState(defaultRefCode);

  useEffect(() => {
    if (workshop) {
      setRefCode(defaultRefCode);
    }
  }, [workshop, defaultRefCode]);

  if (!workshop) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      workshopId: workshop.id,
      name: name.trim(),
      univ: univ.trim(),
      email: email.trim(),
      refCode: refCode.trim().toUpperCase(),
    });
    setName('');
    setUniv('');
    setEmail('');
    onClose();
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
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Confirm Registration
          </button>
        </form>
      </div>
    </div>
  );
}

interface SheetSyncModalProps {
  open: boolean;
  onClose: () => void;
  onSync: (url: string) => Promise<void>;
}

export function SheetSyncModal({ open, onClose, onSync }: SheetSyncModalProps) {
  const [url, setUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
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
              Live Spreadsheet Integration
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
              {syncing ? 'Fetching CSV...' : 'Fetch & Sync Roster'}
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
      </div>
    </div>
  );
}

interface ResetConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetConfirmModal({
  open,
  onCancel,
  onConfirm,
}: ResetConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl max-w-sm w-full p-6 space-y-4">
        <h3
          id="reset-confirm-title"
          className="font-display text-base font-extrabold text-[#111318] dark:text-white"
        >
          Reset Demo Data?
        </h3>
        <p className="text-xs text-[#5A6270] dark:text-slate-400 leading-relaxed">
          This restores the roster, KPI weights, submissions, workshops, and certificates back to
          the default 4-Tier Playbook seed state.
        </p>
        <div className="flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold cursor-pointer"
          >
            Reset Data
          </button>
        </div>
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
    'hierarchy' | 'secretary' | 'kpi' | 'referral'
  >('hierarchy');

  if (!open) return null;

  const topics: {
    id: 'hierarchy' | 'secretary' | 'kpi' | 'referral';
    label: string;
    title: string;
    body: string;
  }[] = [
    {
      id: 'hierarchy',
      label: '4-Tier Structure',
      title: '4-Tier Governance Hierarchy',
      body: '1. Program Chair interfaces with Ulterior Engineering Management and sets quarterly targets. 2. Program Secretary coordinates all 5 Core Team Leads, audits KPIs, and runs ExCom syncs. 3. Five Core Team Leads own functional portfolios and lead Squads A–E. 4. General CAs execute campaigns on their home campuses.',
    },
    {
      id: 'secretary',
      label: 'Secretary Role',
      title: 'Program Secretary Mandate (Tier 2)',
      body: 'The Program Secretary sits between the Program Chair and the 5 Core Team Leads. They supervise cross-squad KPI audits, enforce weekly submission cutoffs, publish central campaign broadcasts, and prepare Chair sync reports.',
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
      body: 'Every General CA receives a personal URL formatted as ?ref=CODE inside their Tier 4 Dashboard. When a student registers for a workshop through that link, the referral code auto-fills and enters the Core Lead and Secretary approval queue.',
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
              4-Tier Governance &amp; KPI Reference
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
