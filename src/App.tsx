import { useEffect, useRef, useState } from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';
import {
  calcPoints,
  DB_KEY,
  DEFAULT_DB,
  loadPortalDB,
  SQUADS_META,
} from './data/playbook';
import {
  Ambassador,
  KpiWeights,
  PortalDB,
  PortalUser,
  SquadName,
  SubmissionType,
  TechPipelineStage,
  UserRole,
  Workshop,
} from './types';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { GovernanceSection } from './components/GovernanceSection';
import { ExComAndSquadsSection } from './components/ExComAndSquadsSection';
import { LeaderboardSection } from './components/LeaderboardSection';
import { WorkshopsAndVerifySection } from './components/WorkshopsAndVerifySection';
import { RoleDashboard } from './components/RoleDashboard';
import {
  ApplyModal,
  AuthModal,
  PlaybookGuideDrawer,
  ResetConfirmModal,
  SheetSyncModal,
  WorkshopModal,
} from './components/PortalModals';

export default function App() {
  const [db, setDb] = useState<PortalDB>(() => loadPortalDB());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('ue_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [detectedRefCode, setDetectedRefCode] = useState('');
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [applyModalState, setApplyModalState] = useState<{
    open: boolean;
    role: string;
    squad: SquadName;
  }>({ open: false, role: 'General Campus Ambassador', squad: 'Squad A' });
  const [activeWorkshop, setActiveWorkshop] = useState<Workshop | null>(null);
  const [sheetSyncOpen, setSheetSyncOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Sync theme class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    try {
      localStorage.setItem('ue_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // Persist DB to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      // ignore storage errors
    }
  }, [db]);

  // Detect ?ref=CODE on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.trim()) {
      setDetectedRefCode(ref.trim().toUpperCase());
    }
  }, []);

  const referringCA = detectedRefCode
    ? db.roster.find((r) => r.code.toUpperCase() === detectedRefCode)
    : undefined;

  // Auth & Role Switching
  const handleDemoLogin = (role: UserRole) => {
    if (role === 'chair') {
      setCurrentUser({
        role: 'chair',
        name: 'Md. Adnan Chowdhury Ifti',
        sub: 'Tier 1 · Program Chair (Super Admin)',
      });
    } else if (role === 'secretary') {
      setCurrentUser({
        role: 'secretary',
        name: db.secretaryName,
        sub: 'Tier 2 · Program Secretary (Executive Operations & Audit)',
      });
    } else if (role === 'lead') {
      setCurrentUser({
        role: 'lead',
        name: 'Operations & CA HR Lead',
        sub: 'Tier 3 · Core Team Lead · Squad A (Dhaka Zone A)',
        squad: 'Squad A',
      });
    } else {
      const firstCA = db.roster[0];
      setCurrentUser({
        role: 'ca',
        name: firstCA.name,
        sub: `Tier 4 · General CA · ${firstCA.campus} (${firstCA.squad})`,
        caCode: firstCA.code,
        squad: firstCA.squad,
      });
    }
    setAuthModalOpen(false);
    setDashboardOpen(true);
  };

  const handleCodeLogin = (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    const ca = db.roster.find((r) => r.code.toUpperCase() === clean);
    if (!ca) {
      showToast('Referral code not found. Try UE-A101 or select a role preview.');
      return;
    }
    setCurrentUser({
      role: 'ca',
      name: ca.name,
      sub: `Tier 4 · General CA · ${ca.campus} (${ca.squad})`,
      caCode: ca.code,
      squad: ca.squad,
    });
    setAuthModalOpen(false);
    setDashboardOpen(true);
  };

  const handleOpenAuthOrDashboard = () => {
    if (currentUser) {
      setDashboardOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDashboardOpen(false);
    showToast('Signed out of dashboard.');
  };

  // Public Mutations
  const handleApply = (role: string, squad?: SquadName) => {
    setApplyModalState({
      open: true,
      role,
      squad: squad || 'Squad A',
    });
  };

  const handleSubmitApplication = (app: {
    role: string;
    name: string;
    campus: string;
    squad: SquadName;
    email: string;
    exp: string;
  }) => {
    setDb((prev) => ({
      ...prev,
      applications: [
        {
          id: `app-${Date.now()}`,
          ...app,
          status: 'Pending',
        },
        ...prev.applications,
      ],
    }));
    showToast(
      'Application submitted. Reviewable in the Program Chair & Secretary dashboards.'
    );
  };

  const handleSubmitWorkshopReg = (reg: {
    workshopId: string;
    name: string;
    univ: string;
    email: string;
    refCode: string;
  }) => {
    setDb((prev) => {
      const targetWs = prev.workshops.find((w) => w.id === reg.workshopId);
      const updatedWorkshops = prev.workshops.map((w) =>
        w.id === reg.workshopId ? { ...w, regs: w.regs + 1 } : w
      );

      let updatedSubs = prev.submissions;
      if (reg.refCode) {
        const ca = prev.roster.find(
          (r) => r.code.toUpperCase() === reg.refCode.toUpperCase()
        );
        updatedSubs = [
          {
            id: `sub-${Date.now()}`,
            caCode: reg.refCode,
            caName: ca ? ca.name : 'External Referral',
            squad: ca ? ca.squad : 'Squad A',
            type: 'Workshop Reg',
            detail: `Auto-tracked registration for "${
              targetWs ? targetWs.title : 'Workshop'
            }" — Participant: ${reg.name} (${reg.univ})`,
            date: new Date().toISOString().slice(0, 10),
            status: 'Pending',
          },
          ...prev.submissions,
        ];
      }

      return {
        ...prev,
        workshops: updatedWorkshops,
        submissions: updatedSubs,
      };
    });

    showToast(
      reg.refCode
        ? `Registered. Referral ${reg.refCode} logged to Core Lead & Secretary approval queue.`
        : `Registration confirmed for ${reg.name}.`
    );
  };

  const handleSubmitClubPitch = (pitch: {
    club: string;
    university: string;
    contact: string;
    type: string;
  }) => {
    setDb((prev) => ({
      ...prev,
      clubPitches: [
        {
          id: `cp-${Date.now()}`,
          ...pitch,
          date: new Date().toISOString().slice(0, 10),
        },
        ...prev.clubPitches,
      ],
    }));
    showToast('Partnership inquiry routed to Lead 5 (Campus Partnerships) & Secretary.');
  };

  // Dashboard Mutations
  const handleReviewSubmission = (
    subId: string,
    decision: 'Approved' | 'Rejected'
  ) => {
    setDb((prev) => {
      const target = prev.submissions.find((s) => s.id === subId);
      if (!target || target.status !== 'Pending') return prev;

      const nextSubs = prev.submissions.map((s) =>
        s.id === subId ? { ...s, status: decision } : s
      );

      const nextRoster =
        decision === 'Approved'
          ? prev.roster.map((ca) => {
              if (ca.code.toUpperCase() !== target.caCode.toUpperCase()) return ca;
              if (target.type === 'Workshop Reg') {
                return { ...ca, workshopRegs: ca.workshopRegs + 1 };
              }
              if (target.type === 'Tech Lead') {
                return { ...ca, techLeads: ca.techLeads + 1 };
              }
              return { ...ca, brandPosts: ca.brandPosts + 1 };
            })
          : prev.roster;

      return {
        ...prev,
        submissions: nextSubs,
        roster: nextRoster,
      };
    });
    showToast(`Submission ${decision.toLowerCase()} — Leaderboard updated.`);
  };

  const handleSubmitCAProof = (type: SubmissionType, detail: string) => {
    const me =
      db.roster.find((r) => r.code === currentUser?.caCode) || db.roster[0];

    setDb((prev) => ({
      ...prev,
      submissions: [
        {
          id: `sub-${Date.now()}`,
          caCode: me.code,
          caName: me.name,
          squad: me.squad,
          type,
          detail,
          date: new Date().toISOString().slice(0, 10),
          status: 'Pending',
        },
        ...prev.submissions,
      ],
      techPipeline:
        type === 'Tech Lead'
          ? [
              {
                id: `UE-LEAD-2026-${Math.floor(200 + Math.random() * 799)}`,
                title: detail.slice(0, 56),
                campus: me.campus,
                submittedBy: `${me.name} (${me.code})`,
                stage: 'New',
                value: 'Student Inquiry',
              },
              ...prev.techPipeline,
            ]
          : prev.techPipeline,
    }));

    showToast('Activity logged and sent to your Core Squad Lead & Secretary.');
  };

  const handleUpdateLeadStage = (id: string, stage: TechPipelineStage) => {
    setDb((prev) => ({
      ...prev,
      techPipeline: prev.techPipeline.map((t) =>
        t.id === id ? { ...t, stage } : t
      ),
    }));
    showToast(`Ticket ${id} moved to "${stage}".`);
  };

  const handlePublishCampaignKit = (title: string, copy: string) => {
    setDb((prev) => ({
      ...prev,
      campaignKits: [
        {
          id: `kit-${Date.now()}`,
          title,
          author:
            currentUser?.role === 'secretary'
              ? 'Tier 2 · Program Secretary'
              : 'ExCom',
          date: new Date().toISOString().slice(0, 10),
          copy,
        },
        ...prev.campaignKits,
      ],
    }));
    showToast('Campaign kit broadcasted to all squads.');
  };

  const handleApproveApplication = (appId: string) => {
    const app = db.applications.find((a) => a.id === appId);
    if (!app) return;

    setDb((prev) => {
      const nextApps = prev.applications.map((a) =>
        a.id === appId ? { ...a, status: 'Approved' as const } : a
      );

      if (app.role === 'Program Secretary') {
        return {
          ...prev,
          secretaryName: `${app.name} (${app.campus})`,
          applications: nextApps,
        };
      }

      const squadLetter = app.squad.split(' ')[1] || 'A';
      const newCode = `UE-${squadLetter}${Math.floor(300 + Math.random() * 699)}`;
      const newCA: Ambassador = {
        id: `ca-${Date.now()}`,
        name: app.name,
        campus: app.campus,
        squad: app.squad,
        code: newCode,
        workshopRegs: 0,
        techLeads: 0,
        brandPosts: 1,
        clubEvents: 0,
        status: 'Active',
      };

      return {
        ...prev,
        roster: [...prev.roster, newCA],
        applications: nextApps,
      };
    });

    showToast(`${app.name} approved and onboarded into the 4-Tier system.`);
  };

  const handleRejectApplication = (appId: string) => {
    setDb((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === appId ? { ...a, status: 'Rejected' } : a
      ),
    }));
    showToast('Application marked as rejected.');
  };

  const handleUpdateKpiWeights = (weights: KpiWeights) => {
    setDb((prev) => ({ ...prev, kpiWeights: weights }));
    showToast('KPI weights updated and leaderboard recalculated.');
  };

  const handleIssueCertificate = (
    holder: string,
    campus: string,
    role: string
  ) => {
    const id = `UE-CA-2026-${String(db.certificates.length + 1).padStart(3, '0')}`;
    setDb((prev) => ({
      ...prev,
      certificates: [
        {
          id,
          holder,
          campus,
          role,
          issued: new Date().toISOString().slice(0, 10),
          status: 'Valid',
        },
        ...prev.certificates,
      ],
    }));
    showToast(`Issued certificate ${id} — verifiable immediately in Section 06.`);
  };

  const handleToggleCertStatus = (id: string) => {
    setDb((prev) => ({
      ...prev,
      certificates: prev.certificates.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'Valid' ? 'Revoked' : 'Valid' }
          : c
      ),
    }));
  };

  const handleCreateWorkshop = (title: string, date: string, fee: string) => {
    setDb((prev) => ({
      ...prev,
      workshops: [
        {
          id: `ws-${Date.now()}`,
          title,
          date,
          mode: 'Ulterior Engineering Official',
          fee,
          seats: 60,
          regs: 0,
          tag: 'New Launch',
        },
        ...prev.workshops,
      ],
    }));
    showToast('New workshop published live to Section 05.');
  };

  // CSV Sync & Export Helpers
  const handleSyncGoogleSheetCSV = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not fetch CSV');
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) throw new Error('CSV appears empty');

      const parsed: Ambassador[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(',')
          .map((c) => c.replace(/^"|"$/g, '').trim());
        if (!cols[0]) continue;
        const candidateSquad = cols[2] as SquadName;
        parsed.push({
          id: `csv-${i}`,
          name: cols[0],
          campus: cols[1] || 'Campus',
          squad: SQUADS_META[candidateSquad] ? candidateSquad : 'Squad A',
          code: cols[3] || `UE-S${100 + i}`,
          workshopRegs: parseInt(cols[4], 10) || 0,
          techLeads: parseInt(cols[5], 10) || 0,
          brandPosts: parseInt(cols[6], 10) || 0,
          clubEvents: 0,
          status: cols[7] || 'Active',
        });
      }

      if (!parsed.length) throw new Error('No valid rows found');
      setDb((prev) => ({ ...prev, roster: parsed }));
      showToast(`Synced ${parsed.length} ambassadors from Google Sheets.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      showToast(
        `Sync failed: Ensure sheet is published as public CSV (${message}).`
      );
      throw err;
    }
  };

  const handleExportCSV = () => {
    const header =
      'Name,Campus,Squad,ReferralCode,WorkshopRegs,TechLeads,BrandPosts,TotalPoints,Status\n';
    const rows = db.roster
      .map(
        (r) =>
          `"${r.name}","${r.campus}","${r.squad}","${r.code}",${r.workshopRegs},${r.techLeads},${r.brandPosts},${calcPoints(r, db.kpiWeights)},"${r.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `UE_CA_Monthly_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Exported Monthly Squad Performance Log (.csv).');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `UE_CA_Portal_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
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

  const handleConfirmReset = () => {
    try {
      localStorage.removeItem(DB_KEY);
    } catch {
      // ignore
    }
    setDb(JSON.parse(JSON.stringify(DEFAULT_DB)) as PortalDB);
    setResetModalOpen(false);
    showToast('Demo database reset to default 4-Tier Playbook state.');
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100">
      <Header
        detectedRefCode={detectedRefCode}
        referringCA={referringCA}
        currentUser={currentUser}
        onOpenAuthOrDashboard={handleOpenAuthOrDashboard}
      />

      <main>
        <HeroSection
          db={db}
          onApply={(role) => handleApply(role)}
          onOpenDashboard={handleOpenAuthOrDashboard}
        />

        <GovernanceSection onApply={(role) => handleApply(role)} />

        <ExComAndSquadsSection
          db={db}
          onApply={handleApply}
          onOpenRoleDemo={handleDemoLogin}
        />

        <LeaderboardSection
          db={db}
          onOpenSheetSync={() => setSheetSyncOpen(true)}
          onExportCSV={handleExportCSV}
        />

        <WorkshopsAndVerifySection
          db={db}
          onSelectWorkshop={(ws) => setActiveWorkshop(ws)}
          onSubmitClubPitch={handleSubmitClubPitch}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E2E5EB] dark:border-[#262B35] py-10 pb-20 text-xs text-[#5A6270] dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-extrabold text-[#111318] dark:text-white tracking-tight">
              Ulterior Engineering
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ca.ulteriorengineering.com</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
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
              onClick={() => handleApply('General Campus Ambassador')}
              className="hover:text-[#B51B27] transition-colors cursor-pointer"
            >
              Recruitment
            </button>
            <button
              type="button"
              onClick={handleOpenAuthOrDashboard}
              className="hover:text-[#B51B27] transition-colors cursor-pointer"
            >
              ExCom Login
            </button>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="hover:text-[#B51B27] font-mono transition-colors cursor-pointer"
            >
              Reset Demo DB
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom-Left Theme Toggle */}
      <div className="fixed bottom-4 left-4 z-40">
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

      {/* Bottom-Right Playbook Guide Trigger */}
      <div className="fixed bottom-4 right-4 z-40">
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

      {/* Role-Based Dashboard Overlay */}
      {dashboardOpen && currentUser && (
        <RoleDashboard
          db={db}
          user={currentUser}
          onSwitchRole={handleDemoLogin}
          onClose={() => setDashboardOpen(false)}
          onLogout={handleLogout}
          onReviewSubmission={handleReviewSubmission}
          onSubmitCAProof={handleSubmitCAProof}
          onUpdateLeadStage={handleUpdateLeadStage}
          onPublishCampaignKit={handlePublishCampaignKit}
          onApproveApplication={handleApproveApplication}
          onRejectApplication={handleRejectApplication}
          onUpdateKpiWeights={handleUpdateKpiWeights}
          onIssueCertificate={handleIssueCertificate}
          onToggleCertStatus={handleToggleCertStatus}
          onCreateWorkshop={handleCreateWorkshop}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onCopyText={handleCopyText}
        />
      )}

      {/* Modals & Drawers */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onDemoLogin={handleDemoLogin}
        onCodeLogin={handleCodeLogin}
      />

      <ApplyModal
        open={applyModalState.open}
        defaultRole={applyModalState.role}
        defaultSquad={applyModalState.squad}
        onClose={() => setApplyModalState((s) => ({ ...s, open: false }))}
        onSubmit={handleSubmitApplication}
      />

      <WorkshopModal
        workshop={activeWorkshop}
        defaultRefCode={detectedRefCode}
        onClose={() => setActiveWorkshop(null)}
        onSubmit={handleSubmitWorkshopReg}
      />

      <SheetSyncModal
        open={sheetSyncOpen}
        onClose={() => setSheetSyncOpen(false)}
        onSync={handleSyncGoogleSheetCSV}
      />

      <ResetConfirmModal
        open={resetModalOpen}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />

      <PlaybookGuideDrawer
        open={guideOpen}
        kpiWeights={db.kpiWeights}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}
