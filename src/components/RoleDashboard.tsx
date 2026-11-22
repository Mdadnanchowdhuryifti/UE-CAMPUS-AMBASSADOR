import { FormEvent, useState } from 'react';
import { Copy, Download, LogOut, ArrowLeft } from 'lucide-react';
import { calcPoints, SQUAD_NAMES } from '../data/playbook';
import {
  KpiWeights,
  PortalDB,
  PortalUser,
  SubmissionType,
  TechPipelineStage,
  UserRole,
} from '../types';

interface RoleDashboardProps {
  db: PortalDB;
  user: PortalUser;
  onSwitchRole: (role: UserRole) => void;
  onClose: () => void;
  onLogout: () => void;
  onReviewSubmission: (subId: string, decision: 'Approved' | 'Rejected') => void;
  onSubmitCAProof: (type: SubmissionType, detail: string) => void;
  onUpdateLeadStage: (id: string, stage: TechPipelineStage) => void;
  onPublishCampaignKit: (title: string, copy: string) => void;
  onApproveApplication: (appId: string) => void;
  onRejectApplication: (appId: string) => void;
  onUpdateKpiWeights: (weights: KpiWeights) => void;
  onIssueCertificate: (holder: string, campus: string, role: string) => void;
  onToggleCertStatus: (id: string) => void;
  onCreateWorkshop: (title: string, date: string, fee: string) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onCopyText: (text: string, message: string) => void;
}

export function RoleDashboard({
  db,
  user,
  onSwitchRole,
  onClose,
  onLogout,
  onReviewSubmission,
  onSubmitCAProof,
  onUpdateLeadStage,
  onPublishCampaignKit,
  onApproveApplication,
  onRejectApplication,
  onUpdateKpiWeights,
  onIssueCertificate,
  onToggleCertStatus,
  onCreateWorkshop,
  onExportJSON,
  onExportCSV,
  onCopyText,
}: RoleDashboardProps) {
  // Chair states
  const [wReg, setWReg] = useState(db.kpiWeights.workshopReg);
  const [wLead, setWLead] = useState(db.kpiWeights.techLead);
  const [wPost, setWPost] = useState(db.kpiWeights.brandPost);
  const [wCert, setWCert] = useState(db.kpiWeights.certThreshold);

  const [cHolder, setCHolder] = useState('');
  const [cCampus, setCCampus] = useState('');
  const [cRole, setCRole] = useState('');

  const [nwTitle, setNwTitle] = useState('');
  const [nwDate, setNwDate] = useState('');
  const [nwFee, setNwFee] = useState('');

  // Secretary state
  const [kitTitle, setKitTitle] = useState('');
  const [kitCopy, setKitCopy] = useState('');

  // General CA state
  const [caSubType, setCaSubType] = useState<SubmissionType>('Brand Post');
  const [caSubDetail, setCaSubDetail] = useState('');

  const roleLabel =
    user.role === 'chair'
      ? 'Tier 1 · Program Chair'
      : user.role === 'secretary'
      ? 'Tier 2 · Program Secretary'
      : user.role === 'lead'
      ? 'Tier 3 · Core Team Lead'
      : 'Tier 4 · General CA';

  const handleSaveWeights = (e: FormEvent) => {
    e.preventDefault();
    onUpdateKpiWeights({
      ...db.kpiWeights,
      workshopReg: Number(wReg) || 15,
      techLead: Number(wLead) || 40,
      brandPost: Number(wPost) || 5,
      certThreshold: Number(wCert) || 120,
    });
  };

  const handleIssueCert = (e: FormEvent) => {
    e.preventDefault();
    if (!cHolder.trim() || !cCampus.trim() || !cRole.trim()) return;
    onIssueCertificate(cHolder.trim(), cCampus.trim(), cRole.trim());
    setCHolder('');
    setCCampus('');
    setCRole('');
  };

  const handleCreateWs = (e: FormEvent) => {
    e.preventDefault();
    if (!nwTitle.trim() || !nwDate.trim() || !nwFee.trim()) return;
    onCreateWorkshop(nwTitle.trim(), nwDate.trim(), nwFee.trim());
    setNwTitle('');
    setNwDate('');
    setNwFee('');
  };

  const handlePublishKit = (e: FormEvent) => {
    e.preventDefault();
    if (!kitTitle.trim() || !kitCopy.trim()) return;
    onPublishCampaignKit(kitTitle.trim(), kitCopy.trim());
    setKitTitle('');
    setKitCopy('');
  };

  const handleSubmitProof = (e: FormEvent) => {
    e.preventDefault();
    if (!caSubDetail.trim()) return;
    onSubmitCAProof(caSubType, caSubDetail.trim());
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

  const currentCA =
    db.roster.find((r) => r.code === user.caCode) || db.roster[0];
  const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${currentCA.code}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F5F7] dark:bg-[#0D0F12] overflow-y-auto">
      {/* Sticky Workspace Header */}
      <div className="sticky top-0 z-10 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-mono font-semibold text-[#B51B27] truncate">
              {roleLabel}
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base text-[#111318] dark:text-white truncate">
              {user.name}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Switch dashboard role view"
              value={user.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="hidden sm:block text-xs bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#B51B27]"
            >
              <option value="chair">View: Tier 1 · Program Chair</option>
              <option value="secretary">View: Tier 2 · Secretary</option>
              <option value="lead">View: Tier 3 · Core Lead</option>
              <option value="ca">View: Tier 4 · General CA</option>
            </select>

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
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#111318] text-white dark:bg-slate-800 hover:bg-[#B51B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TIER 1: PROGRAM CHAIR */}
        {user.role === 'chair' && (
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
                  Tech Lead Pipeline
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                  {db.techPipeline.length}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Squad A–E Performance Benchmark
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
                    Save Weights &amp; Recalculate Leaderboard
                  </button>
                </form>
              </div>
            </div>

            {/* Recruitment Queue */}
            <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
              <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                Recruitment Queue (Approve &amp; Auto-Onboard)
              </h3>
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
                          · {a.campus} · {a.squad}
                        </span>
                      </div>
                      <p className="text-[#5A6270] dark:text-slate-400 mt-1">{a.exp}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApproveApplication(a.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Approve &amp; Onboard
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectApplication(a.id)}
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
                        onClick={() => onToggleCertStatus(c.id)}
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
                  Publish New Workshop &amp; Backup Data
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

        {/* TIER 2: PROGRAM SECRETARY */}
        {user.role === 'secretary' && (
          <>
            <div className="bg-[#111318] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#262B35]">
              <div>
                <div className="text-xs font-mono font-semibold text-[#B51B27]">
                  Tier 2 · Executive Coordination Hub
                </div>
                <h3 className="font-display text-lg font-extrabold mt-0.5">
                  Program Secretary Audit &amp; ExCom Operations
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Oversee all 5 Core Team Leads, audit cross-squad KPI submissions, publish central
                  broadcasts, and export weekly reports for the Program Chair.
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
                    All 5 Squads
                  </span>
                </div>
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
                              onClick={() => onReviewSubmission(s.id, 'Approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                            >
                              Audit &amp; Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => onReviewSubmission(s.id, 'Rejected')}
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
                          {cp.type} · {cp.contact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TIER 3: CORE TEAM LEAD */}
        {user.role === 'lead' && (
          <>
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  Squad KPI Approval Queue (Live Leaderboard Sync)
                </h3>
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                  {db.submissions.map((s) => (
                    <div
                      key={s.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-[#111318] dark:text-white">
                          {s.caName}{' '}
                          <span className="font-mono text-[#B51B27]">({s.caCode})</span>
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
                              onClick={() => onReviewSubmission(s.id, 'Approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => onReviewSubmission(s.id, 'Rejected')}
                              className="border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
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
              </div>

              <div className="lg:col-span-5 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                  FYDP / Tech Lead Pipeline (Lead 3 View)
                </h3>
                <div className="divide-y divide-[#E2E5EB] dark:divide-[#262B35] text-xs">
                  {db.techPipeline.map((t) => (
                    <div key={t.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[#B51B27]">{t.id}</span>
                        <select
                          aria-label={`Pipeline stage for ${t.title}`}
                          value={t.stage}
                          onChange={(e) =>
                            onUpdateLeadStage(t.id, e.target.value as TechPipelineStage)
                          }
                          className="text-xs bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 border border-[#E2E5EB] dark:border-[#262B35] rounded px-2 py-1"
                        >
                          <option value="New">New</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Handoff to UE">Handoff to UE</option>
                        </select>
                      </div>
                      <div className="font-bold text-[#111318] dark:text-white">{t.title}</div>
                      <div className="text-[#5A6270] dark:text-slate-400">
                        {t.campus} · Via {t.submittedBy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
              <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                {user.squad || 'Squad A'} Active Roster Health
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {db.roster
                  .filter((r) => r.squad === (user.squad || 'Squad A'))
                  .map((m) => (
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
          </>
        )}

        {/* TIER 4: GENERAL CA */}
        {user.role === 'ca' && (() => {
          const pts = calcPoints(currentCA, db.kpiWeights);
          const certPct = Math.min(
            100,
            Math.round((pts / db.kpiWeights.certThreshold) * 100)
          );
          const mySubs = db.submissions.filter((s) => s.caCode === currentCA.code);

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
                    {currentCA.workshopRegs}
                  </div>
                </div>
                <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5">
                  <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
                    Verified Tech Leads
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums mt-1 text-[#111318] dark:text-white">
                    {currentCA.techLeads}
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

              {/* Referral Link Box */}
              <div className="bg-[#111318] text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#262B35]">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#B51B27]">
                    Personal Automated Referral Engine
                  </div>
                  <div className="text-sm font-bold mt-1">
                    Your Code:{' '}
                    <span className="font-mono text-white underline">{currentCA.code}</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 break-all font-mono">
                    {shareUrl}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopyText(shareUrl, 'Personal referral link copied to clipboard.')}
                  className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shrink-0 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Referral Link</span>
                </button>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                {/* Submit Weekly Proof / FYDP Lead */}
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
                      Submit to Core Lead &amp; Secretary
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

                {/* Ready-to-Deploy Campaign Kits */}
                <div className="lg:col-span-6 bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6">
                  <h3 className="font-display font-bold text-base text-[#111318] dark:text-white mb-4">
                    Ready-to-Deploy Campaign Kits (Lead 4 &amp; Secretary)
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
