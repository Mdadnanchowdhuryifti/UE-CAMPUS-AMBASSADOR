import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Lock } from 'lucide-react';
import {
  calcPoints,
  CORE_LEADS_LIST,
  SQUAD_NAMES,
  SQUADS_META,
} from '../data/playbook';
import {
  getFirstOpenRecruitmentRoleTitle,
  hasAnyOpenRecruitmentRole,
  isFullAccessRole,
} from '../services/portalService';
import { listAllUserProfiles } from '../services/profileService';
import { PortalDB, PortalUser, RoleAssignment, SquadName, UserProfile, UserRole } from '../types';

function initialsOf(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar for an ExCom card: the member's uploaded profile photo when one
 * exists, otherwise the original initials box (nothing is removed).
 */
function PersonAvatar({
  profile,
  fallbackName,
  fallbackInitials,
  boxClass,
}: {
  profile: UserProfile | null;
  fallbackName: string;
  fallbackInitials: string;
  boxClass: string;
}) {
  if (profile?.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={profile.displayName || fallbackName}
        className="w-14 h-14 rounded-lg object-cover border border-[#E2E5EB] dark:border-[#262B35] shrink-0 transition-transform duration-300 hover:scale-105"
      />
    );
  }
  return (
    <div
      className={`w-14 h-14 rounded-lg flex items-center justify-center font-display font-extrabold text-lg shrink-0 ${boxClass}`}
    >
      {initialsOf(profile?.displayName || fallbackName, fallbackInitials)}
    </div>
  );
}

interface ExComAndSquadsSectionProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  onApply: (role: string, squad?: SquadName) => void;
  onOpenPersonalPortal: () => void;
  onOpenExecutivePortal: () => void;
  /** Which part to render: the ExCom section, the Squads section, or both (default, original one-page behaviour). */
  part?: 'excom' | 'squads' | 'both';
}

export function ExComAndSquadsSection({
  db,
  currentUser,
  onApply,
  onOpenPersonalPortal,
  onOpenExecutivePortal,
  part = 'both',
}: ExComAndSquadsSectionProps) {
  const [activeSquad, setActiveSquad] = useState<SquadName>('Squad A');

  const squadMeta = SQUADS_META[activeSquad];
  const squadMembers = db.roster.filter((r) => r.squad === activeSquad);
  const squadTotalPts = squadMembers.reduce(
    (sum, m) => sum + calcPoints(m, db.kpiWeights),
    0
  );

  const hasFullAccess = !!currentUser?.assigned && isFullAccessRole(currentUser.role);
  const canAccessChair = hasFullAccess;
  const canAccessSecretary =
    hasFullAccess || (currentUser?.assigned && currentUser.role === 'secretary');

  // Public profiles (photo, name, university, club) of role holders, used to
  // personalise the ExCom cards. Loaded only for signed-in viewers (the
  // users collection is not public); when unavailable, the cards fall back
  // to the names from the portal settings, exactly as before. Private
  // details are never read here.
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  useEffect(() => {
    if (!currentUser) {
      setProfiles([]);
      return;
    }
    let cancelled = false;
    listAllUserProfiles()
      .then((list) => {
        if (!cancelled) setProfiles(list);
      })
      .catch(() => {
        if (!cancelled) setProfiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  const profileForRole = (role: UserRole): UserProfile | null =>
    profiles.find((p) => p.role === role) ?? null;
  // Who actually holds a role, per the role_assignments registry — the
  // source of truth for the assigned person's name and email.
  const assignmentForRole = (role: UserRole): RoleAssignment | null =>
    db.roleAssignments.find((a) => a.role === role) ?? null;
  // A role holder's public profile: match by email first (a saved
  // profile's own role field may still say 'ca'), then by role.
  const profileForAssignment = (
    assignment: RoleAssignment | null,
    role: UserRole
  ): UserProfile | null => {
    if (assignment?.email) {
      const byEmail = profiles.find(
        (p) => p.email && p.email.toLowerCase() === assignment.email.toLowerCase()
      );
      if (byEmail) return byEmail;
    }
    return profileForRole(role);
  };
  const ceoProfile = profileForAssignment(assignmentForRole('ceo'), 'ceo');
  const chairProfile = profileForAssignment(assignmentForRole('chair'), 'chair');
  const secretaryProfile = profileForAssignment(assignmentForRole('secretary'), 'secretary');

  return (
    <>
      {part !== 'squads' && (
        <>
      {/* SECTION 02: EXECUTIVE COMMITTEE */}
      <section
        id="excom"
        className="py-16 lg:py-20 bg-white dark:bg-[#15181E]/50 border-b border-[#E2E5EB] dark:border-[#262B35]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                02. Executive Committee (ExCom 2026–2027)
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white text-balance">
                Program Leadership &amp; Role-Locked Portals
              </h2>
            </div>
            {hasAnyOpenRecruitmentRole(db.recruitmentStatus) ? (
              <button
                type="button"
                onClick={() =>
                  onApply(
                    getFirstOpenRecruitmentRoleTitle(db.recruitmentStatus) ||
                      'General Campus Ambassador'
                  )
                }
                className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-[#B51B27] text-[#B51B27] hover:bg-[#B51B27] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>View Recruitment Circular &amp; Apply</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="self-start md:self-auto inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#2E3440] bg-[#E2E5EB] dark:bg-[#1E222B] text-[#5A6270] dark:text-slate-400 whitespace-nowrap shrink-0 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>All Recruitment Closed</span>
              </button>
            )}
          </div>

          {/* Tier 1 Leadership Row — hierarchy order (decided 2026-11-25):
              CEO first, then Chair, then Secretary, then the Leads. */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Company CEO — Tier 1, first card. */}
            <div className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start">
              <PersonAvatar
                profile={ceoProfile}
                fallbackName={db.ceoName}
                fallbackInitials="EX"
                boxClass="bg-[#111318] text-white"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  <span className="font-semibold text-[#111318] dark:text-white">
                    Tier 1 · Company CEO
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Full Executive Access
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold mt-2 text-[#111318] dark:text-white">
                  {ceoProfile?.displayName || db.ceoName}
                </h3>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                  {ceoProfile
                    ? [ceoProfile.position || 'Company CEO', ceoProfile.university, ceoProfile.club]
                        .filter(Boolean)
                        .join(' · ')
                    : 'Company CEO Oversight · Ulterior Engineering'}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={canAccessChair ? onOpenPersonalPortal : onOpenExecutivePortal}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B51B27] hover:underline cursor-pointer"
                  >
                    {canAccessChair ? (
                      <>
                        <span>
                          {currentUser?.role === 'ceo'
                            ? 'Open CEO Executive Console'
                            : 'Open Executive Console'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chair &amp; CEO Email Sign-In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Program Chair — Tier 1, second card. */}
            <div className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start">
              <PersonAvatar
                profile={chairProfile}
                fallbackName={db.chairName}
                fallbackInitials="EX"
                boxClass="bg-[#111318] text-white"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  <span className="font-semibold text-[#111318] dark:text-white">
                    Tier 1 · Program Chair
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Full Executive Access
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold mt-2 text-[#111318] dark:text-white">
                  {chairProfile?.displayName || db.chairName}
                </h3>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                  Program Chair · Company CEO Oversight: <strong className="text-[#111318] dark:text-slate-200">{ceoProfile?.displayName || db.ceoName}</strong>
                </p>
                <p className="text-xs text-[#5A6270] dark:text-slate-300 mt-3 leading-relaxed">
                  Both the Developer-appointed Program Chair and Company CEO share full operational
                  authority over recruitment open/close controls, ExCom operations, credentials, and
                  all squads.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={canAccessChair ? onOpenPersonalPortal : onOpenExecutivePortal}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B51B27] hover:underline cursor-pointer"
                  >
                    {canAccessChair ? (
                      <>
                        <span>
                          {currentUser?.role === 'developer'
                            ? 'Open Developer & Chair Console'
                            : currentUser?.role === 'ceo'
                            ? 'Open CEO Executive Console'
                            : 'Open Chair Master Console'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chair &amp; CEO Email Sign-In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Program Secretary — Tier 2, after the Tier 1 row. */}
          <div className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#B51B27]/40 rounded-xl p-6 flex flex-col sm:flex-row gap-5 items-start mb-10">
            <PersonAvatar
              profile={secretaryProfile}
              fallbackName={db.secretaryName}
              fallbackInitials="GS"
              boxClass="bg-[#B51B27] text-white"
            />
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#5A6270] dark:text-slate-400">
                  <span className="font-semibold text-[#B51B27]">
                    Tier 2 · Program Secretary
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    Personal Verified Access
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold mt-2 text-[#111318] dark:text-white">
                  {secretaryProfile?.displayName || db.secretaryName}
                </h3>
                <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                  Executive Operations Bridge · Reports directly to Program Chair
                  {secretaryProfile?.university ? ` · ${secretaryProfile.university}` : ''}
                  {secretaryProfile?.club ? ` · ${secretaryProfile.club}` : ''}
                </p>
                <p className="text-xs text-[#5A6270] dark:text-slate-300 mt-3 leading-relaxed">
                  Coordinates the 5 Core Team Leads, audits cross-squad weekly KPI logs, publishes
                  central campaign broadcasts, and prepares Chair sync CSV exports.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {db.recruitmentStatus.secretary ? (
                    <button
                      type="button"
                      onClick={() => onApply('Program Secretary')}
                      className="inline-flex items-center gap-1.5 bg-[#B51B27] hover:bg-[#92141E] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Apply as Secretary</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="inline-flex items-center gap-1.5 bg-[#E2E5EB] dark:bg-[#1E222B] text-[#5A6270] dark:text-slate-400 border border-[#D0D5DD] dark:border-[#2E3440] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Recruitment Closed</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onOpenPersonalPortal}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6270] dark:text-slate-300 hover:text-[#B51B27] cursor-pointer"
                  >
                    {canAccessSecretary ? (
                      <>
                        <span>Open Secretary Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Secretary Login Only</span>
                      </>
                    )}
                  </button>
                </div>
            </div>
          </div>

          {/* Tier 3: 5 Core Team Leads Grid */}
          <div className="mb-4 text-xs font-mono text-[#5A6270] dark:text-slate-400">
            Tier 3 · Five Core Team Lead Segments (Each Lead accesses strictly their own assigned
            portfolio &amp; squad)
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CORE_LEADS_LIST.map((lead) => {
              const canOpenThisLead =
                hasFullAccess || (currentUser?.assigned && currentUser.role === lead.id);
              const leadAssignment = assignmentForRole(lead.id);
              const leadProfile = profileForAssignment(leadAssignment, lead.id);
              const leadHolderName =
                leadProfile?.displayName || leadAssignment?.displayName || null;
              return (
                <div
                  key={lead.id}
                  className="bg-[#F4F5F7] dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5 flex flex-col justify-between hover:border-[#B51B27] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-[#5A6270] dark:text-slate-400">
                      <span className="font-bold text-[#B51B27]">Lead {lead.num}</span>
                      <span>{lead.squad}</span>
                    </div>
                    <h4 className="font-display font-bold text-sm mt-2 leading-snug text-[#111318] dark:text-white">
                      {lead.title}
                    </h4>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-1">
                      ExCom: {lead.excom}
                    </div>
                    <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-2.5 leading-relaxed">
                      {lead.desc}
                    </p>
                    {leadHolderName && (
                      <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-[#E2E5EB] dark:border-[#262B35]">
                        {leadProfile?.photoURL ? (
                          <img
                            src={leadProfile.photoURL}
                            alt={leadHolderName}
                            className="w-9 h-9 rounded-full object-cover border border-[#E2E5EB] dark:border-[#262B35] shrink-0 transition-transform duration-300 hover:scale-110"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#B51B27]/10 text-[#B51B27] flex items-center justify-center text-[11px] font-bold shrink-0">
                            {initialsOf(leadHolderName, '—')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#111318] dark:text-white truncate">
                            {leadHolderName}
                          </div>
                          <div className="text-[11px] text-[#5A6270] dark:text-slate-400 truncate">
                            {[leadProfile?.university || leadAssignment?.campus, leadProfile?.club]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 space-y-2">
                    {canOpenThisLead ? (
                      <button
                        type="button"
                        onClick={onOpenPersonalPortal}
                        className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg bg-[#B51B27] text-white hover:bg-[#92141E] transition-colors cursor-pointer"
                      >
                        <span>Open Lead {lead.num} Segment</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : db.recruitmentStatus[lead.id] ? (
                      <button
                        type="button"
                        onClick={() => onApply(lead.title, lead.squad)}
                        className="w-full inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg bg-white dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] hover:text-[#B51B27] transition-colors cursor-pointer"
                      >
                        <span>Apply for Lead {lead.num}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-[#E2E5EB] dark:bg-[#1E222B] border border-[#D0D5DD] dark:border-[#2E3440] text-[#5A6270] dark:text-slate-400 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Recruitment Closed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
        </>
      )}

      {part !== 'excom' && (
        <>
      {/* SECTION 03: CAMPUS SQUADS A-E & WEEKLY OPERATING CADENCE */}
      <section
        id="squads"
        className="py-16 lg:py-20 border-b border-[#E2E5EB] dark:border-[#262B35]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                03. Dual Execution Matrix · Tier 4 Squads
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white text-balance">
                Five Regional Campus Squads (A – E)
              </h2>
            </div>
            <p className="text-sm text-[#5A6270] dark:text-slate-400 max-w-md leading-relaxed">
              Every General Campus Ambassador belongs to a geographic squad while executing
              centralized campaign kits across all three pillars.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Campus Squads"
            className="flex flex-wrap gap-2 mb-6"
          >
            {SQUAD_NAMES.map((sq) => {
              const isAct = sq === activeSquad;
              return (
                <button
                  key={sq}
                  type="button"
                  role="tab"
                  aria-selected={isAct}
                  onClick={() => setActiveSquad(sq)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors border whitespace-nowrap shrink-0 cursor-pointer ${
                    isAct
                      ? 'bg-[#B51B27] text-white border-[#B51B27]'
                      : 'bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-200 border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27]'
                  }`}
                >
                  {sq} · {SQUADS_META[sq].cluster.split('(')[0].trim()}
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 sm:p-8 mb-10">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="font-bold text-[#111318] dark:text-white">{activeSquad}</span>
                  <span className="text-[#5A6270]" aria-hidden="true">·</span>
                  <span className="text-[#B51B27] font-semibold">{squadMeta.leadPortfolio}</span>
                </div>
                <h3 className="font-display text-xl font-extrabold text-[#111318] dark:text-white">
                  {squadMeta.cluster}
                </h3>
                <p className="text-sm text-[#5A6270] dark:text-slate-300 leading-relaxed">
                  {squadMeta.coverage}
                </p>

                <div className="pt-2">
                  <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-2">
                    Target Institutional Coverage
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium text-[#111318] dark:text-slate-200">
                    {squadMeta.campuses.map((campus, idx) => (
                      <span key={campus} className="inline-flex items-center gap-3">
                        <span>{campus}</span>
                        {idx < squadMeta.campuses.length - 1 && (
                          <span className="text-[#E2E5EB] dark:text-[#262B35]" aria-hidden="true">
                            /
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 md:border-l md:border-[#E2E5EB] dark:md:border-[#262B35] md:pl-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
                      {squadMembers.length}
                    </div>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400">
                      Active Ambassadors
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold font-mono tabular-nums text-[#B51B27]">
                      {squadTotalPts}
                    </div>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400">
                      Monthly Squad Points
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#E2E5EB] dark:border-[#262B35] pt-4">
                  <div className="text-xs font-mono text-[#5A6270] dark:text-slate-400 mb-2.5">
                    Current Squad Roster
                  </div>
                  <div className="space-y-2 text-xs">
                    {squadMembers.length > 0 ? (
                      squadMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-2">
                          <span className="text-[#111318] dark:text-slate-100">
                            <strong className="font-semibold">{m.name}</strong>{' '}
                            <span className="text-[#5A6270] dark:text-slate-400">({m.campus})</span>
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-[#111318] dark:text-white shrink-0">
                            {calcPoints(m, db.kpiWeights)} pts
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#5A6270] dark:text-slate-400">
                        Recruiting ambassadors for this squad.
                      </div>
                    )}
                  </div>
                </div>

                {db.recruitmentStatus.ca ? (
                  <button
                    type="button"
                    onClick={() => onApply('General Campus Ambassador', activeSquad)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#111318] dark:bg-[#B51B27] text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-[#B51B27] dark:hover:bg-[#92141E] transition-colors cursor-pointer"
                  >
                    <span>Join {activeSquad} as Campus Ambassador</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#E2E5EB] dark:bg-[#1E222B] text-[#5A6270] dark:text-slate-400 border border-[#D0D5DD] dark:border-[#2E3440] text-xs font-semibold py-2.5 px-4 rounded-lg cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Recruitment Closed</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Operating Cadence Strip */}
          <div className="bg-[#111318] text-white rounded-xl p-6 sm:p-8 border border-[#262B35]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-6 border-b border-slate-800">
              <div className="text-xs font-mono font-semibold text-[#B51B27]">
                Weekly Operating Cadence
              </div>
              <div className="text-xs font-mono text-slate-400">
                Chair ↔ Secretary ↔ 5 Core Leads ↔ General CAs
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-slate-400">01 · 30-Minute Sync</div>
                <div className="font-display font-bold text-base">Weekly Core Sync</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Chaired by the Program Chair and coordinated by the Secretary with all 5 Core
                  Leads. Review audited KPI logs, remove lead blockers, and lock next week&apos;s
                  campaign kit.
                </p>
              </div>

              <div className="space-y-1.5 md:border-l md:border-slate-800 md:pl-6">
                <div className="text-xs font-mono text-slate-400">02 · Within 24 Hours</div>
                <div className="font-display font-bold text-base">
                  Squad Deployment &amp; Briefing
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Each Core Lead briefs their dedicated Squad (A–E) with bite-sized weekly
                  deliverables, referral links, and campus activation deadlines.
                </p>
              </div>

              <div className="space-y-1.5 md:border-l md:border-slate-800 md:pl-6">
                <div className="text-xs font-mono text-slate-400">03 · Weekly Cutoff</div>
                <div className="font-display font-bold text-base">Proof Submission &amp; Audit</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  General CAs submit referral confirmations, post links, and FYDP leads via their
                  personal portal. Scoped Core Leads approve and the Secretary audits the live
                  leaderboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </>
  );
}
