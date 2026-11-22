import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Crown,
  Database,
  Download,
  Lock,
  LogOut,
  ShieldCheck,
  Terminal,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { calcPoints, SQUAD_NAMES } from '../data/playbook';
import { isFullAccessRole, LEAD_TO_SQUAD, ROLE_LABELS } from '../services/portalService';
import {
  ClubPitchStatus,
  KpiWeights,
  LeadRole,
  PortalDB,
  PortalUser,
  SquadName,
  SubmissionType,
  TechPipelineStage,
  UserRole,
} from '../types';

type DashboardSegment =
  | 'developer'
  | 'chair'
  | 'roles'
  | 'secretary'
  | 'lead1'
  | 'lead2'
  | 'lead3'
  | 'lead4'
  | 'lead5'
  | 'ca';

interface RoleDashboardProps {
  db: PortalDB;
  user: PortalUser;
  onClose: () => void;
  onLogout: () => Promise<void>;
  onApplyForRole: () => void;
  onSeedCloudDB: () => Promise<void>;
  onUpsertRole: (input: {
    email: string;
    displayName: string;
    role: UserRole;
    squad: 'ALL' | SquadName;
    caCode: string;
    campus: string;
  }) => Promise<void>;
  onDeleteRole: (emailKey: string) => Promise<void>;
  onAddAmbassador: (input: {
    name: string;
    campus: string;
    squad: SquadName;
    code: string;
  }) => Promise<void>;
  onReviewSubmission: (
    subId: string,
    caCode: string,
    type: SubmissionType,
    decision: 'Approved' | 'Rejected'
  ) => Promise<void>;
  onSubmitCAProof: (type: SubmissionType, detail: string) => Promise<void>;
  onUpdateLeadStage: (id: string, stage: TechPipelineStage) => Promise<void>;
  onPublishCampaignKit: (title: string, copy: string) => Promise<void>;
  onDeleteCampaignKit: (kitId: string) => Promise<void>;
  onApproveApplication: (appId: string) => Promise<void>;
  onRejectApplication: (appId: string) => Promise<void>;
  onUpdateKpiWeights: (weights: KpiWeights) => Promise<void>;
  onIssueCertificate: (holder: string, campus: string, role: string) => Promise<void>;
  onToggleCertStatus: (id: string, currentStatus: 'Valid' | 'Revoked') => Promise<void>;
  onCreateWorkshop: (title: string, date: string, fee: string) => Promise<void>;
  onUpdateClubPitchStatus: (pitchId: string, status: ClubPitchStatus) => Promise<void>;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onCopyText: (text: string, message: string) => void;
}

export function RoleDashboard({
  db,
  user,
  onClose,
  onLogout,
  onApplyForRole,
  onSeedCloudDB,
  onUpsertRole,
  onDeleteRole,
  onAddAmbassador,
  onReviewSubmission,
  onSubmitCAProof,
  onUpdateLeadStage,
  onPublishCampaignKit,
  onDeleteCampaignKit,
  onApproveApplication,
  onRejectApplication,
  onUpdateKpiWeights,
  onIssueCertificate,
  onToggleCertStatus,
  onCreateWorkshop,
  onUpdateClubPitchStatus,
  onExportJSON,
  onExportCSV,
  onCopyText,
}: RoleDashboardProps) {
  const isDeveloper = user.assigned && user.role === 'developer';
  const isFullAccess = user.assigned && isFullAccessRole(user.role);

  // ONLY Platform Developer and Developer-appointed Program Chair can navigate across all segments.
  // Every other role is strictly locked to their own assigned segment!
  const [selectedSegment, setSelectedSegment] = useState<DashboardSegment>(() =>
    user.role === 'developer' ? 'developer' : 'chair'
  );

  useEffect(() => {
    if (user.role === 'developer') {
      setSelectedSegment('developer');
    } else if (user.role === 'chair') {
      setSelectedSegment('chair');
    }
  }, [user.role]);

  const activeSegment: DashboardSegment = isFullAccess
    ? !isDeveloper && selectedSegment === 'developer'
      ? 'chair'
      : selectedSegment
    : ((user.role || 'ca') as DashboardSegment);

  // Developer-only Program Chair Appointment form state
  const [chairEmail, setChairEmail] = useState('');
  const [chairDisplayName, setChairDisplayName] = useState('');
  const [chairCampus, setChairCampus] = useState('');
  const [chairCode, setChairCode] = useState('UE-EXCOM-01');

  // Chair KPI Weights state
  const [wReg, setWReg] = useState(db.kpiWeights.workshopReg);
  const [wLead, setWLead] = useState(db.kpiWeights.techLead);
  const [wPost, setWPost] = useState(db.kpiWeights.brandPost);
  const [wCert, setWCert] = useState(db.kpiWeights.certThreshold);

  useEffect(() => {
    setWReg(db.kpiWeights.workshopReg);
    setWLead(db.kpiWeights.techLead);
    setWPost(db.kpiWeights.brandPost);
    setWCert(db.kpiWeights.certThreshold);
  }, [db.kpiWeights]);

  // Role assignment form state (Developer: all roles; Chair: subordinate roles only)
  const [roleEmail, setRoleEmail] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState<UserRole>('secretary');
  const [roleSquad, setRoleSquad] = useState<'ALL' | SquadName>('Squad A');
  const [roleCaCode, setRoleCaCode] = useState('');
  const [roleCampus, setRoleCampus] = useState('');

  // Certificate form state (Chair only)
  const [cHolder, setCHolder] = useState('');
  const [cCampus, setCCampus] = useState('');
  const [cRole, setCRole] = useState('');

  // Workshop form state (Chair + Lead 2)
  const [nwTitle, setNwTitle] = useState('');
  const [nwDate, setNwDate] = useState('');
  const [nwFee, setNwFee] = useState('');

  // Ambassador add form (Chair + Lead 1)
  const [ambName, setAmbName] = useState('');
  const [ambCampus, setAmbCampus] = useState('');
  const [ambSquad, setAmbSquad] = useState<SquadName>('Squad A');
  const [ambCode, setAmbCode] = useState('');

  // Campaign kit form (Chair + Secretary + Lead 4)
  const [kitTitle, setKitTitle] = useState('');
  const [kitCopy, setKitCopy] = useState('');

  // General CA proof form
  const [caSubType, setCaSubType] = useState<SubmissionType>('Brand Post');
  const [caSubDetail, setCaSubDetail] = useState('');

  const handleSaveWeights = async (e: FormEvent) => {
    e.preventDefault();
    await onUpdateKpiWeights({
      ...db.kpiWeights,
      workshopReg: Number(wReg) || 15,
      techLead: Number(wLead) || 40,
      brandPost: Number(wPost) || 5,
      certThreshold: Number(wCert) || 120,
    });
  };

  const handleAppointChair = async (e: FormEvent) => {
    e.preventDefault();
    if (!isDeveloper || !chairEmail.trim() || !chairDisplayName.trim()) return;
    await onUpsertRole({
      email: chairEmail.trim(),
      displayName: chairDisplayName.trim(),
      role: 'chair',
      squad: 'ALL',
      caCode: chairCode.trim() || 'UE-EXCOM-01',
      campus: chairCampus.trim() || 'Ulterior Engineering',
    });
    setChairEmail('');
    setChairDisplayName('');
    setChairCampus('');
  };

  const handleAssignRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!roleEmail.trim() || !roleName.trim()) return;
    // Enforce client-side parity with Firestore Rules: only Developer can assign developer/chair
    const safeRole: UserRole =
      !isDeveloper && (roleType === 'developer' || roleType === 'chair')
        ? 'secretary'
        : roleType;
    await onUpsertRole({
      email: roleEmail.trim(),
      displayName: roleName.trim(),
      role: safeRole,
      squad: roleSquad,
      caCode: roleCaCode.trim(),
      campus: roleCampus.trim(),
    });
    setRoleEmail('');
    setRoleName('');
    setRoleCaCode('');
    setRoleCampus('');
  };

  const handleIssueCert = async (e: FormEvent) => {
    e.preventDefault();
    if (!cHolder.trim() || !cCampus.trim() || !cRole.trim()) return;
    await onIssueCertificate(cHolder.trim(), cCampus.trim(), cRole.trim());
    setCHolder('');
    setCCampus('');
    setCRole('');
  };

  const handleCreateWs = async (e: FormEvent) => {
    e.preventDefault();
    if (!nwTitle.trim() || !nwDate.trim() || !nwFee.trim()) return;
    await onCreateWorkshop(nwTitle.trim(), nwDate.trim(), nwFee.trim());
    setNwTitle('');
    setNwDate('');
    setNwFee('');
  };

  const handleAddAmb = async (e: FormEvent) => {
    e.preventDefault();
    if (!ambName.trim() || !ambCampus.trim() || !ambCode.trim()) return;
    await onAddAmbassador({
      name: ambName.trim(),
      campus: ambCampus.trim(),
      squad: ambSquad,
      code: ambCode.trim().toUpperCase(),
    });
    setAmbName('');
    setAmbCampus('');
    setAmbCode('');
  };

  const handlePublishKit = async (e: FormEvent) => {
    e.preventDefault();
    if (!kitTitle.trim() || !kitCopy.trim()) return;
    await onPublishCampaignKit(kitTitle.trim(), kitCopy.trim());
    setKitTitle('');
    setKitCopy('');
  };

  const handleSubmitProof = async (e: FormEvent) => {
    e.preventDefault();
    if (!caSubDetail.trim()) return;
    await onSubmitCAProof(caSubType, caSubDetail.trim());
    setCaSubDetail('');
  };

  const squadTotals = SQUAD_NAMES.map((sq) => ({
    sq,
    pts: db.roster
      .filter((r) => r.squad === sq)
      .reduce((s, r) => s + calcPoints(r, db.kpiWeights), 0),
    count: db.roster.filter((r) => r.squad === sq).length,
  }));
  const maxSquadPts = Math.max(100, ...squadTotals.map((s) => s.pts));
  const pendingApps = db.applications.filter((a) => a.status === 'Pending');
  const pendingSubs = db.submissions.filter((s) => s.status === 'Pending');

  // Helper to render Squad KPI Queue scoped strictly to one squad (for Leads 1-5)
  const renderScopedSquadQueue = (leadRole: LeadRole) => {
    const targetSquad = LEAD_TO_SQUAD[leadRole];
    const scopedSubs = db.submissions.filter((s) => s.squad === targetSquad);
    const scopedMembers = db.roster.filter((r) => r.squad === targetSquad);

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
              {targetSquad} KPI Approval Queue ({scopedSubs.filter((s) => s.status === 'Pending').length} Pending)
            </h3>
            <span className="text-xs font-mono text-[#B51B27] font-semibold">
              Scoped to {targetSquad} Only
            </span>
          </div>
          {scopedSubs.length === 0 ? (
            <p className="text-xs text-[#5A6270] dark:text-slate-400">
              No KPI submissions logged for {targetSquad} yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
              {scopedSubs.map((s) => (
                <div
                  key={s.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[#111318] dark:text-white">
                      {s.caName} <span className="font-mono text-[#B51B27]">({s.caCode})</span>
                    </div>
                    <div className="text-[#5A6270] dark:text-slate-300 mt-0.5">
                      <strong className="font-semibold">{s.type}:</strong> {s.detail}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void onReviewSubmission(s.id, s.caCode, s.type, 'Approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void onReviewSubmission(s.id, s.caCode, s.type, 'Rejected')}
                          className="border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 px-3 py-1.5 rounded-lg hover:border-[#B51B27] cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="font-mono font-semibold text-[#5A6270] dark:text-slate-400">
                        {s.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
          <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
            {targetSquad} Active Ambassadors ({scopedMembers.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {scopedMembers.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35]"
              >
                <div className="font-bold text-[#111318] dark:text-white">{m.name}</div>
                <div className="text-[#5A6270] dark:text-slate-400 mt-0.5">{m.campus}</div>
                <div className="mt-3 flex justify-between font-mono tabular-nums">
                  <span className="text-[#5A6270] dark:text-slate-400">{m.code}</span>
                  <span className="font-bold text-[#B51B27]">
                    {calcPoints(m, db.kpiWeights)} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F5F7] dark:bg-[#0D0F12] overflow-y-auto">
      {/* Sticky Workspace Header */}
      <div className="sticky top-0 z-20 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27] truncate">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {user.assigned && user.role
                  ? ROLE_LABELS[user.role]
                  : 'Verified Google Account · Access Pending'}
              </span>
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#111318] dark:text-white truncate">
              {user.displayName}{' '}
              <span className="font-normal text-xs text-[#5A6270] dark:text-slate-400">
                ({user.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>

            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#111318] text-white dark:bg-slate-800 hover:bg-[#B51B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* DEVELOPER & APPOINTED CHAIR ONLY: Full-Site Segment Navigator */}
        {isFullAccess && (
          <div className="border-t border-[#E2E5EB] dark:border-[#262B35] bg-white/90 dark:bg-[#15181E]/90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  ...(isDeveloper
                    ? [{ id: 'developer' as DashboardSegment, label: 'Developer Root' }]
                    : []),
                  { id: 'chair' as DashboardSegment, label: 'Chair Master' },
                  { id: 'roles' as DashboardSegment, label: 'Access & Roles' },
                  { id: 'secretary' as DashboardSegment, label: 'Secretary Hub' },
                  { id: 'lead1' as DashboardSegment, label: 'Lead 1 · Ops' },
                  { id: 'lead2' as DashboardSegment, label: 'Lead 2 · Growth' },
                  { id: 'lead3' as DashboardSegment, label: 'Lead 3 · Tech' },
                  { id: 'lead4' as DashboardSegment, label: 'Lead 4 · Brand' },
                  { id: 'lead5' as DashboardSegment, label: 'Lead 5 · Clubs' },
                  { id: 'ca' as DashboardSegment, label: 'CA Portal' },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedSegment(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSegment === tab.id
                      ? tab.id === 'developer'
                        ? 'bg-[#111318] text-white dark:bg-[#B51B27]'
                        : 'bg-[#B51B27] text-white'
                      : 'text-[#5A6270] dark:text-slate-300 hover:text-[#111318] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* UNASSIGNED USER ACCESS GATE */}
        {(!user.assigned || !user.role) && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl p-8 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
              <Lock className="w-4 h-4" />
              <span>Personal Access Restricted</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-[#111318] dark:text-white">
              Your Google Account is Verified — Awaiting Role Assignment
            </h2>
            <p className="text-sm text-[#5A6270] dark:text-slate-300 leading-relaxed">
              Signed in as <strong className="text-[#111318] dark:text-white">{user.email}</strong>.
              To protect ExCom operations and personal data, only accounts explicitly authorized by
              the <strong>Platform Developer</strong> or appointed <strong>Program Chair</strong>{' '}
              can open role-locked dashboards.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onApplyForRole}
                className="bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
              >
                Submit Official Role Application
              </button>
              <button
                type="button"
                onClick={onClose}
                className="border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 text-xs font-semibold px-5 py-2.5 rounded-lg hover:border-[#B51B27] cursor-pointer"
              >
                Return to Public Portal
              </button>
            </div>

            {db.applications.length > 0 && (
              <div className="pt-5 border-t border-[#E2E5EB] dark:border-[#262B35] space-y-2.5">
                <div className="text-xs font-mono font-semibold text-[#5A6270] dark:text-slate-400">
                  Your Submitted Applications
                </div>
                {db.applications.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#111318] dark:text-white">{a.role}</div>
                      <div className="text-[#5A6270] dark:text-slate-400">
                        {a.campus} · {a.squad}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#B51B27]">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TIER 0: PLATFORM DEVELOPER ROOT CONSOLE ==================== */}
        {isDeveloper && activeSegment === 'developer' && (
          <div className="space-y-6">
            <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#B51B27]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Tier 0 · Platform Developer Root Control</span>
                </div>
                <h3 className="font-display text-xl font-extrabold mt-1">
                  Supreme Full-Site Control &amp; Program Chair Appointment
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  You hold exclusive Tier 0 Root authority over this website. Only the Developer
                  can appoint, replace, or revoke the <strong>Program Chair</strong>, manage root
                  database backups, and inspect every ExCom &amp; Ambassador workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onExportJSON}
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-[#B51B27] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => void onSeedCloudDB()}
                  className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Initialize Cloud DB</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Appoint Program Chair Card */}
              <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-[#B51B27]" />
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white">
                    Appoint Program Chair (Tier 1)
                  </h4>
                </div>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mb-4">
                  Enter the Google email of the person you are appointing as Program Chair. They
                  will receive full operational access across the site, while Tier 0 root controls
                  remain strictly locked to the Developer.
                </p>

                <form onSubmit={handleAppointChair} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                      Appointed Chair Google Email
                    </label>
                    <input
                      type="email"
                      required
                      value={chairEmail}
                      onChange={(e) => setChairEmail(e.target.value)}
                      placeholder="chair.email@gmail.com"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                      Program Chair Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={chairDisplayName}
                      onChange={(e) => setChairDisplayName(e.target.value)}
                      placeholder="e.g., Md. Adnan Chowdhury Ifti"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                        University / Campus
                      </label>
                      <input
                        type="text"
                        value={chairCampus}
                        onChange={(e) => setChairCampus(e.target.value)}
                        placeholder="e.g., North South University"
                        className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                        ExCom Code
                      </label>
                      <input
                        type="text"
                        value={chairCode}
                        onChange={(e) => setChairCode(e.target.value)}
                        placeholder="UE-EXCOM-01"
                        className="w-full font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                  >
                    Appoint Official Program Chair
                  </button>
                </form>
              </div>

              {/* Active Chair & Root Authority Registry */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h4 className="font-display font-bold text-base text-[#111318] dark:text-white">
                      Developer-Appointed Program Chair(s)
                    </h4>
                    <span className="text-xs font-mono text-[#B51B27] font-semibold">
                      Public Display: {db.chairName}
                    </span>
                  </div>
                  {db.roleAssignments.filter((r) => r.role === 'chair').length === 0 ? (
                    <p className="text-xs text-[#5A6270] dark:text-slate-400">
                      No separate Program Chair email has been appointed yet. Use the form on the
                      left to appoint a Program Chair.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                      {db.roleAssignments
                        .filter((r) => r.role === 'chair')
                        .map((chair) => (
                          <div
                            key={chair.id}
                            className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-[#111318] dark:text-white">
                                {chair.displayName}{' '}
                                <span className="font-mono font-normal text-[#5A6270] dark:text-slate-400">
                                  ({chair.email})
                                </span>
                              </div>
                              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                                Tier 1 · Program Chair · Full Operational Access · {chair.campus}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void onDeleteRole(chair.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#B51B27] hover:underline shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke Chair</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-3">
                    Full-Site Authority Matrix
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-lg bg-[#111318] text-white border border-[#262B35]">
                      <div className="font-mono text-[11px] text-[#B51B27] font-semibold">
                        TIER 0 · SOLE ROOT CONTROL
                      </div>
                      <div className="font-bold mt-1">Platform Developer</div>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        Full site control, exclusively appoints/revokes Program Chair, owns
                        destructive database permissions &amp; root overrides.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35]">
                      <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        TIER 1 · APPOINTED FULL ACCESS
                      </div>
                      <div className="font-bold text-[#111318] dark:text-white mt-1">
                        Program Chair
                      </div>
                      <p className="text-[#5A6270] dark:text-slate-400 mt-1 leading-relaxed">
                        Full operational access to Chair, Secretary, Leads 1–5 &amp; CA segments.
                        Cannot appoint or modify Developer/Chair accounts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== DEVELOPER & CHAIR: ACCESS & ROLE MANAGER ==================== */}
        {isFullAccess && activeSegment === 'roles' && (
          <div className="space-y-6">
            <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  {isDeveloper
                    ? 'Tier 0 · Developer Root Security Control'
                    : 'Tier 1 · Program Chair Subordinate Role Manager'}
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Personal Email Access &amp; Role Assignment Registry
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  {isDeveloper
                    ? 'As Platform Developer, you can assign or revoke any role including Program Chair, Secretary, Core Team Leads 1–5, and General CAs.'
                    : 'As Developer-appointed Program Chair, you can assign or revoke Secretary, Core Team Leads 1–5, and General CAs. Developer and Program Chair accounts can only be modified by the Platform Developer.'}
                </p>
              </div>
              {isDeveloper && db.roster.length === 0 && (
                <button
                  type="button"
                  onClick={() => void onSeedCloudDB()}
                  className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Seed Default Roster</span>
                </button>
              )}
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Assign Role Form */}
              <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-4 h-4 text-[#B51B27]" />
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white">
                    Assign Personal Role by Email
                  </h4>
                </div>
                <form onSubmit={handleAssignRole} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                      Personal Google Email
                    </label>
                    <input
                      type="email"
                      required
                      value={roleEmail}
                      onChange={(e) => setRoleEmail(e.target.value)}
                      placeholder="member@gmail.com"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="Member Full Name"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                      Authorized Role Segment
                    </label>
                    <select
                      value={roleType}
                      onChange={(e) => setRoleType(e.target.value as UserRole)}
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    >
                      {isDeveloper && (
                        <>
                          <option value="developer">
                            Tier 0 · Platform Developer (Root Control)
                          </option>
                          <option value="chair">
                            Tier 1 · Program Chair (Appointed Full Access)
                          </option>
                        </>
                      )}
                      <option value="secretary">Tier 2 · Program Secretary (Secretary Only)</option>
                      <option value="lead1">Tier 3 · Lead 1 (Operations &amp; HR · Squad A)</option>
                      <option value="lead2">Tier 3 · Lead 2 (Workshop Growth · Squad B)</option>
                      <option value="lead3">Tier 3 · Lead 3 (Tech Lead-Gen · Squad C)</option>
                      <option value="lead4">Tier 3 · Lead 4 (Brand &amp; PR · Squad D)</option>
                      <option value="lead5">Tier 3 · Lead 5 (Clubs &amp; Events · Squad E)</option>
                      <option value="ca">Tier 4 · General Campus Ambassador</option>
                    </select>
                  </div>

                  {roleType === 'ca' && (
                    <div>
                      <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                        Assigned Squad
                      </label>
                      <select
                        value={roleSquad}
                        onChange={(e) => setRoleSquad(e.target.value as SquadName)}
                        className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      >
                        {SQUAD_NAMES.map((sq) => (
                          <option key={sq} value={sq}>
                            {sq}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                        Referral / ID Code
                      </label>
                      <input
                        type="text"
                        value={roleCaCode}
                        onChange={(e) => setRoleCaCode(e.target.value)}
                        placeholder="e.g., UE-A101"
                        className="w-full font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                        Campus
                      </label>
                      <input
                        type="text"
                        value={roleCampus}
                        onChange={(e) => setRoleCampus(e.target.value)}
                        placeholder="e.g., NSU, BUET"
                        className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                  >
                    Save Personal Role Permission
                  </button>
                </form>
              </div>

              {/* Active Role Assignments List */}
              <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Authorized Personal Accounts ({db.roleAssignments.length})
                </h4>
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                  {db.roleAssignments.length === 0 ? (
                    <p className="text-[#5A6270] dark:text-slate-400">
                      Only the bootstrapped Platform Developer account is active. Appoint a Program
                      Chair, Secretary, Core Team Leads, or Ambassadors using the form.
                    </p>
                  ) : (
                    db.roleAssignments.map((ra) => {
                      const isSelf = ra.email.toLowerCase() === user.email.toLowerCase();
                      const isProtectedFromChair =
                        !isDeveloper && (ra.role === 'developer' || ra.role === 'chair');
                      return (
                        <div
                          key={ra.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-[#111318] dark:text-white">
                              {ra.displayName}{' '}
                              <span className="font-mono font-normal text-[#5A6270] dark:text-slate-400">
                                ({ra.email})
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-[#B51B27] mt-0.5">
                              {ROLE_LABELS[ra.role]} · {ra.squad}
                              {ra.caCode ? ` · ${ra.caCode}` : ''}
                            </div>
                          </div>
                          {isProtectedFromChair ? (
                            <span className="font-mono text-[11px] text-[#5A6270] dark:text-slate-400 shrink-0">
                              Developer Protected
                            </span>
                          ) : (
                            !isSelf && (
                              <button
                                type="button"
                                onClick={() => void onDeleteRole(ra.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A6270] hover:text-[#B51B27] shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke</span>
                              </button>
                            )
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TIER 1: CHAIR MASTER CONSOLE ==================== */}
        {isFullAccess && activeSegment === 'chair' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  Total Roster
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                  {db.roster.length} CAs
                </div>
              </div>
              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  Pending Recruitment
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-[#B51B27] mt-1">
                  {pendingApps.length}
                </div>
              </div>
              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  Valid Certificates
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                  {db.certificates.filter((c) => c.status === 'Valid').length}
                </div>
              </div>
              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  Assigned Accounts
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                  {db.roleAssignments.length}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Squad A–E Performance Benchmark (Live Cloud Data)
                </h3>
                <div className="space-y-3.5">
                  {squadTotals.map((s) => (
                    <div key={s.sq}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#111318] dark:text-slate-100">
                          {s.sq}{' '}
                          <span className="text-[#5A6270] dark:text-slate-400 font-normal">
                            ({s.count} CAs)
                          </span>
                        </span>
                        <span className="font-mono font-bold tabular-nums text-[#111318] dark:text-white">
                          {s.pts} pts
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F4F5F7] dark:bg-[#0D0F12] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#B51B27] rounded-full"
                          style={{ width: `${Math.round((s.pts / maxSquadPts) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  KPI Point Weight Configurator
                </h3>
                <form onSubmit={handleSaveWeights} className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[#5A6270] dark:text-slate-400 block mb-1">
                      Workshop Reg
                    </label>
                    <input
                      type="number"
                      value={wReg}
                      onChange={(e) => setWReg(Number(e.target.value))}
                      className="w-full font-mono tabular-nums bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[#5A6270] dark:text-slate-400 block mb-1">
                      Verified Tech Lead
                    </label>
                    <input
                      type="number"
                      value={wLead}
                      onChange={(e) => setWLead(Number(e.target.value))}
                      className="w-full font-mono tabular-nums bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[#5A6270] dark:text-slate-400 block mb-1">
                      Brand Post
                    </label>
                    <input
                      type="number"
                      value={wPost}
                      onChange={(e) => setWPost(Number(e.target.value))}
                      className="w-full font-mono tabular-nums bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[#5A6270] dark:text-slate-400 block mb-1">
                      Cert Min Threshold
                    </label>
                    <input
                      type="number"
                      value={wCert}
                      onChange={(e) => setWCert(Number(e.target.value))}
                      className="w-full font-mono tabular-nums bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    className="col-span-2 bg-[#111318] dark:bg-[#B51B27] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#92141E] transition-colors cursor-pointer"
                  >
                    Save Weights to Cloud Firestore
                  </button>
                </form>
              </div>
            </div>

            {/* Recruitment Queue */}
            <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
              <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                Recruitment Queue (Approve Automatically Grants Personal Role Access)
              </h3>
              {db.applications.length === 0 ? (
                <p className="text-xs text-[#5A6270] dark:text-slate-400">
                  No recruitment applications submitted yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35]">
                  {db.applications.map((a) => (
                    <div
                      key={a.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-[#111318] dark:text-white">
                            {a.name}
                          </span>
                          <span className="font-mono text-[#B51B27] font-semibold">{a.role}</span>
                          <span className="text-[#5A6270] dark:text-slate-400">
                            · {a.campus} · {a.squad} · {a.email}
                          </span>
                        </div>
                        <p className="text-[#5A6270] dark:text-slate-400 mt-1">{a.exp}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void onApproveApplication(a.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                            >
                              Approve &amp; Grant Access
                            </button>
                            <button
                              type="button"
                              onClick={() => void onRejectApplication(a.id)}
                              className="border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 px-3 py-1.5 rounded-lg hover:border-[#B51B27] cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`font-mono font-semibold ${
                              a.status === 'Approved'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-[#5A6270] dark:text-slate-400'
                            }`}
                          >
                            {a.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Certificate Issuer & Workshop Creator */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  Live Certificate Issuer &amp; Revoker
                </h3>
                <form onSubmit={handleIssueCert} className="grid sm:grid-cols-2 gap-2.5 text-xs">
                  <input
                    type="text"
                    required
                    value={cHolder}
                    onChange={(e) => setCHolder(e.target.value)}
                    placeholder="Recipient Name"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    value={cCampus}
                    onChange={(e) => setCCampus(e.target.value)}
                    placeholder="University"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    value={cRole}
                    onChange={(e) => setCRole(e.target.value)}
                    placeholder="Credential Title (e.g., Program Secretary)"
                    className="sm:col-span-2 bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                  >
                    Issue Verifiable Certificate ID
                  </button>
                </form>

                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] max-h-52 overflow-y-auto text-xs">
                  {db.certificates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 gap-2">
                      <div className="text-[#111318] dark:text-slate-200">
                        <span className="font-mono font-bold">{c.id}</span> · {c.holder}{' '}
                        <span className="text-[#5A6270] dark:text-slate-400">({c.status})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onToggleCertStatus(c.id, c.status)}
                        className="font-semibold text-[#B51B27] hover:underline shrink-0 cursor-pointer"
                      >
                        {c.status === 'Valid' ? 'Revoke' : 'Restore'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
                  Publish New Workshop &amp; Cloud Exports
                </h3>
                <form onSubmit={handleCreateWs} className="grid sm:grid-cols-2 gap-2.5 text-xs">
                  <input
                    type="text"
                    required
                    value={nwTitle}
                    onChange={(e) => setNwTitle(e.target.value)}
                    placeholder="Workshop Title"
                    className="sm:col-span-2 bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    value={nwDate}
                    onChange={(e) => setNwDate(e.target.value)}
                    placeholder="Date (e.g., Jan 10, 2027)"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    value={nwFee}
                    onChange={(e) => setNwFee(e.target.value)}
                    placeholder="Fee (e.g., BDT 400)"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 bg-[#111318] dark:bg-white text-white dark:text-[#111318] font-semibold py-2.5 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#B51B27] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Publish Live to Portal
                  </button>
                </form>

                <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onExportJSON}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Full DB (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportCSV}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Roster (.csv)</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== TIER 2: PROGRAM SECRETARY SEGMENT ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'secretary') &&
          activeSegment === 'secretary' && (
            <>
              <div className="bg-[#111318] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#262B35]">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#B51B27]">
                    Tier 2 · Program Secretary Operations Hub
                  </div>
                  <h3 className="font-display text-lg font-extrabold mt-0.5">
                    Cross-Squad KPI Audits &amp; Executive Coordination
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Exclusive Secretary workspace to audit KPI logs across Squads A–E, publish
                    central campaign broadcasts, and prepare Chair sync reports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Chair Sync CSV</span>
                </button>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-base text-[#111318] dark:text-white">
                      Cross-Squad KPI Audit Queue ({pendingSubs.length} Pending)
                    </h3>
                    <span className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      Squads A–E
                    </span>
                  </div>
                  {db.submissions.length === 0 ? (
                    <p className="text-xs text-[#5A6270] dark:text-slate-400">
                      No submissions awaiting audit.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                      {db.submissions.map((s) => (
                        <div
                          key={s.id}
                          className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-semibold text-[#111318] dark:text-white">
                              {s.caName}{' '}
                              <span className="font-mono text-[#B51B27]">
                                ({s.caCode} · {s.squad})
                              </span>
                            </div>
                            <div className="text-[#5A6270] dark:text-slate-300 mt-0.5">
                              <strong className="font-semibold">{s.type}:</strong> {s.detail}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {s.status === 'Pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onReviewSubmission(s.id, s.caCode, s.type, 'Approved')
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                                >
                                  Audit &amp; Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onReviewSubmission(s.id, s.caCode, s.type, 'Rejected')
                                  }
                                  className="border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 px-3 py-1.5 rounded-lg hover:border-[#B51B27] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="font-mono font-semibold text-[#5A6270] dark:text-slate-400">
                                {s.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                    <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-3">
                      Publish Central Broadcast / Campaign Kit
                    </h3>
                    <form onSubmit={handlePublishKit} className="space-y-3 text-xs">
                      <input
                        type="text"
                        required
                        value={kitTitle}
                        onChange={(e) => setKitTitle(e.target.value)}
                        placeholder="Circular / Campaign Kit Title"
                        className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                      />
                      <textarea
                        rows={3}
                        required
                        value={kitCopy}
                        onChange={(e) => setKitCopy(e.target.value)}
                        placeholder="Official caption, deadline, or briefing for all 5 Core Leads & CAs..."
                        className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                      />
                      <button
                        type="submit"
                        className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                      >
                        Broadcast to All Squads
                      </button>
                    </form>
                  </div>

                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                    <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-3">
                      Club Partnership Inquiries ({db.clubPitches.length})
                    </h3>
                    <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                      {db.clubPitches.map((cp) => (
                        <div key={cp.id} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="font-semibold text-[#111318] dark:text-white">
                            {cp.club} · <span className="text-[#B51B27]">{cp.university}</span>
                          </div>
                          <div className="text-[#5A6270] dark:text-slate-400 mt-0.5">
                            {cp.type} · {cp.contact} · {cp.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        {/* ==================== TIER 3: LEAD 1 (OPERATIONS & CA HR · SQUAD A) ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'lead1') &&
          activeSegment === 'lead1' && (
            <div className="space-y-6">
              <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35]">
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 3 · Lead 1 Exclusive Segment
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Operations &amp; CA HR Portal (Squad A — Dhaka Zone A)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Manage active ambassador onboarding records, roster entries, and Squad A KPI
                  approvals.
                </p>
              </div>

              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Add Ambassador to Live Roster
                </h4>
                <form onSubmit={handleAddAmb} className="grid sm:grid-cols-4 gap-3 text-xs">
                  <input
                    type="text"
                    required
                    value={ambName}
                    onChange={(e) => setAmbName(e.target.value)}
                    placeholder="Ambassador Full Name"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    value={ambCampus}
                    onChange={(e) => setAmbCampus(e.target.value)}
                    placeholder="Campus (e.g., AIUB)"
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  />
                  <select
                    value={ambSquad}
                    onChange={(e) => setAmbSquad(e.target.value as SquadName)}
                    className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                  >
                    {SQUAD_NAMES.map((sq) => (
                      <option key={sq} value={sq}>
                        {sq}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={ambCode}
                      onChange={(e) => setAmbCode(e.target.value)}
                      placeholder="Code (UE-A109)"
                      className="flex-1 min-w-0 font-mono bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold px-4 py-2 rounded-lg shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {renderScopedSquadQueue('lead1')}
            </div>
          )}

        {/* ==================== TIER 3: LEAD 2 (WORKSHOP & COURSE GROWTH · SQUAD B) ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'lead2') &&
          activeSegment === 'lead2' && (
            <div className="space-y-6">
              <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35]">
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 3 · Lead 2 Exclusive Segment
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Workshop &amp; Course Growth Portal (Squad B — Central &amp; Public)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Launch new bootcamps, track participant referral registrations, and approve Squad
                  B KPIs.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                    Publish New Workshop
                  </h4>
                  <form onSubmit={handleCreateWs} className="space-y-3 text-xs">
                    <input
                      type="text"
                      required
                      value={nwTitle}
                      onChange={(e) => setNwTitle(e.target.value)}
                      placeholder="Workshop / Bootcamp Title"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={nwDate}
                        onChange={(e) => setNwDate(e.target.value)}
                        placeholder="Date (e.g., Jan 15, 2027)"
                        className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                      <input
                        type="text"
                        required
                        value={nwFee}
                        onChange={(e) => setNwFee(e.target.value)}
                        placeholder="Fee (e.g., BDT 500)"
                        className="bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                    >
                      Publish Workshop Live
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                    Recent Workshop Registrations ({db.workshopRegistrations.length})
                  </h4>
                  {db.workshopRegistrations.length === 0 ? (
                    <p className="text-xs text-[#5A6270] dark:text-slate-400">
                      No live registrations recorded yet. New enrollments from Section 05 appear
                      here automatically.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs max-h-60 overflow-y-auto">
                      {db.workshopRegistrations.map((reg) => (
                        <div key={reg.id} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="font-semibold text-[#111318] dark:text-white">
                            {reg.participantName}{' '}
                            <span className="text-[#5A6270] dark:text-slate-400 font-normal">
                              ({reg.university})
                            </span>
                          </div>
                          <div className="text-[#5A6270] dark:text-slate-400">
                            {reg.workshopTitle}
                            {reg.refCode ? (
                              <span className="font-mono text-[#B51B27] font-semibold">
                                {' '}
                                · Ref: {reg.refCode}
                              </span>
                            ) : (
                              ' · Direct'
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {renderScopedSquadQueue('lead2')}
            </div>
          )}

        {/* ==================== TIER 3: LEAD 3 (TECH PROJECT & LEAD-GEN · SQUAD C) ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'lead3') &&
          activeSegment === 'lead3' && (
            <div className="space-y-6">
              <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35]">
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 3 · Lead 3 Exclusive Segment
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Technical Project &amp; Lead-Gen Portal (Squad C — Engineering Hub)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Qualify FYDP, robotics, and hardware engineering leads for handoff to Ulterior
                  Engineering engineers, and manage Squad C KPIs.
                </p>
              </div>

              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  FYDP / Hardware Tech Lead Pipeline ({db.techPipeline.length})
                </h4>
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                  {db.techPipeline.map((t) => (
                    <div
                      key={t.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#B51B27]">{t.id}</div>
                        <div className="font-bold text-sm text-[#111318] dark:text-white mt-0.5">
                          {t.title}
                        </div>
                        <div className="text-[#5A6270] dark:text-slate-400">
                          {t.campus} · Via {t.submittedBy} · {t.value}
                        </div>
                      </div>
                      <select
                        aria-label={`Pipeline stage for ${t.title}`}
                        value={t.stage}
                        onChange={(e) =>
                          void onUpdateLeadStage(t.id, e.target.value as TechPipelineStage)
                        }
                        className="text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2 shrink-0"
                      >
                        <option value="New">New</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Handoff to UE">Handoff to UE</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {renderScopedSquadQueue('lead3')}
            </div>
          )}

        {/* ==================== TIER 3: LEAD 4 (BRAND & DIGITAL PR · SQUAD D) ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'lead4') &&
          activeSegment === 'lead4' && (
            <div className="space-y-6">
              <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35]">
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 3 · Lead 4 Exclusive Segment
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Brand &amp; Digital Publicity Studio (Squad D — Regional Universities)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Publish official ready-to-deploy campaign kits and captions for all ambassadors,
                  and manage Squad D KPIs.
                </p>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                    Create Campaign Kit
                  </h4>
                  <form onSubmit={handlePublishKit} className="space-y-3 text-xs">
                    <input
                      type="text"
                      required
                      value={kitTitle}
                      onChange={(e) => setKitTitle(e.target.value)}
                      placeholder="Campaign Kit Title"
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                    />
                    <textarea
                      rows={4}
                      required
                      value={kitCopy}
                      onChange={(e) => setKitCopy(e.target.value)}
                      placeholder="Approved LinkedIn / Facebook caption and outreach text..."
                      className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                    >
                      Publish Kit to All CAs
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                    Published Campaign Kits ({db.campaignKits.length})
                  </h4>
                  <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                    {db.campaignKits.map((k) => (
                      <div key={k.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#111318] dark:text-white">
                            {k.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => void onDeleteCampaignKit(k.id)}
                            className="text-[#5A6270] hover:text-[#B51B27] font-semibold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-[#5A6270] dark:text-slate-300 leading-relaxed">
                          {k.copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {renderScopedSquadQueue('lead4')}
            </div>
          )}

        {/* ==================== TIER 3: LEAD 5 (CAMPUS CLUBS & EVENTS · SQUAD E) ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'lead5') &&
          activeSegment === 'lead5' && (
            <div className="space-y-6">
              <div className="bg-[#111318] text-white rounded-xl p-6 border border-[#262B35]">
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 3 · Lead 5 Exclusive Segment
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Campus Partnerships &amp; Events Portal (Squad E — Polytechnic &amp; Emerging)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Coordinate IEEE, Robotics, and EEE/CSE club seminar inquiries and manage Squad E
                  KPI approvals.
                </p>
              </div>

              <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h4 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Club Collaboration &amp; Seminar Inquiries ({db.clubPitches.length})
                </h4>
                {db.clubPitches.length === 0 ? (
                  <p className="text-xs text-[#5A6270] dark:text-slate-400">
                    No club inquiries received yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                    {db.clubPitches.map((cp) => (
                      <div
                        key={cp.id}
                        className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#111318] dark:text-white">
                            {cp.club} · <span className="text-[#B51B27]">{cp.university}</span>
                          </div>
                          <div className="text-[#5A6270] dark:text-slate-400 mt-0.5">
                            {cp.type} · Contact: {cp.contact} · {cp.date}
                          </div>
                        </div>
                        <select
                          aria-label={`Status for ${cp.club}`}
                          value={cp.status}
                          onChange={(e) =>
                            void onUpdateClubPitchStatus(
                              cp.id,
                              e.target.value as ClubPitchStatus
                            )
                          }
                          className="text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2 shrink-0"
                        >
                          <option value="New">New</option>
                          <option value="In Review">In Review</option>
                          <option value="Confirmed">Confirmed</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderScopedSquadQueue('lead5')}
            </div>
          )}

        {/* ==================== TIER 4: GENERAL CAMPUS AMBASSADOR PORTAL ==================== */}
        {user.assigned &&
          (isFullAccess || user.role === 'ca') &&
          activeSegment === 'ca' &&
          (() => {
            const matchedCA =
              db.roster.find(
                (r) => r.code.toUpperCase() === (user.caCode || '').toUpperCase()
              ) || db.roster[0];

            const effectiveCode = user.caCode || matchedCA?.code || 'UE-CA01';
            const pts = matchedCA ? calcPoints(matchedCA, db.kpiWeights) : 0;
            const certPct = Math.min(
              100,
              Math.round((pts / db.kpiWeights.certThreshold) * 100)
            );
            const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${effectiveCode}`;
            const mySubs = db.submissions.filter(
              (s) => s.submitterUid === user.uid || s.caCode === effectiveCode
            );

            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      My Verified Points
                    </div>
                    <div className="text-2xl font-extrabold font-mono tabular-nums text-[#B51B27] mt-1">
                      {pts}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      Workshop Regs
                    </div>
                    <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                      {matchedCA?.workshopRegs ?? 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      Verified Tech Leads
                    </div>
                    <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                      {matchedCA?.techLeads ?? 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      Certificate Progress
                    </div>
                    <div className="text-lg font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                      {certPct}%
                    </div>
                    <div className="w-full h-1.5 bg-[#F4F5F7] dark:bg-[#0D0F12] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: `${certPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#111318] text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#262B35]">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#B51B27]">
                      Personal Automated Referral Engine
                    </div>
                    <div className="text-sm font-bold mt-1">
                      Your Code:{' '}
                      <span className="font-mono text-white underline">{effectiveCode}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 break-all font-mono">
                      {shareUrl}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onCopyText(shareUrl, 'Personal referral link copied to clipboard.')
                    }
                    className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Referral Link</span>
                  </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                    <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                      Submit Weekly Activity / FYDP Lead
                    </h3>
                    <form onSubmit={handleSubmitProof} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                          Activity Type
                        </label>
                        <select
                          value={caSubType}
                          onChange={(e) => setCaSubType(e.target.value as SubmissionType)}
                          className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5"
                        >
                          <option value="Brand Post">
                            Brand &amp; Digital Awareness Post (+{db.kpiWeights.brandPost} pts)
                          </option>
                          <option value="Tech Lead">
                            FYDP / Hardware / Service Lead (+{db.kpiWeights.techLead} pts)
                          </option>
                          <option value="Workshop Reg">
                            Confirmed Workshop Referral (+{db.kpiWeights.workshopReg} pts)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#111318] dark:text-slate-200 mb-1">
                          Proof Link / Client Details
                        </label>
                        <textarea
                          rows={3}
                          required
                          minLength={5}
                          value={caSubDetail}
                          onChange={(e) => setCaSubDetail(e.target.value)}
                          placeholder="Paste LinkedIn/Facebook post URL, or describe the FYDP team & contact info..."
                          className="w-full bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 rounded-lg cursor-pointer"
                      >
                        Submit to Squad Lead &amp; Secretary
                      </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-[#E2E5EB] dark:border-[#262B35]">
                      <div className="text-xs font-bold text-[#111318] dark:text-white mb-2.5">
                        My Submission History ({mySubs.length})
                      </div>
                      <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs max-h-48 overflow-y-auto">
                        {mySubs.length > 0 ? (
                          mySubs.map((s) => (
                            <div
                              key={s.id}
                              className="py-2.5 first:pt-0 last:pb-0 flex justify-between gap-2"
                            >
                              <div className="text-[#111318] dark:text-slate-200">
                                <strong className="font-semibold">{s.type}:</strong> {s.detail}
                              </div>
                              <span
                                className={`font-mono font-semibold shrink-0 ${
                                  s.status === 'Approved'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : s.status === 'Rejected'
                                    ? 'text-[#B51B27]'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {s.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[#5A6270] dark:text-slate-400">
                            No submissions logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                    <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                      Ready-to-Deploy Campaign Kits
                    </h3>
                    <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                      {db.campaignKits.map((k) => (
                        <div key={k.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#111318] dark:text-white">
                              {k.title}
                            </span>
                            <span className="font-mono text-[#5A6270] dark:text-slate-400 shrink-0">
                              {k.date}
                            </span>
                          </div>
                          <p className="text-[#5A6270] dark:text-slate-300 leading-relaxed">
                            {k.copy}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              onCopyText(
                                `${k.copy}\n\nRegister here: ${shareUrl}`,
                                'Campaign kit and your referral link copied.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 font-semibold text-[#B51B27] hover:underline cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Caption + My Referral Link</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
      </div>
    </div>
  );
}
