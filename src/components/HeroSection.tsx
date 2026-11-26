import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedCounter } from './AnimatedCounter';
import { ArrowRight, ArrowUpRight, Crown, Lock, ShieldCheck, Timer } from 'lucide-react';
import {
  getFirstOpenRecruitmentRoleTitle,
  hasAnyOpenRecruitmentRole,
} from '../services/portalService';
import { PortalDB, PortalUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeroSectionProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  onApply: (role: string) => void;
  onOpenDashboard: () => void;
  onOpenExecutiveSignIn: () => void;
}

export function HeroSection({
  db,
  currentUser,
  onApply,
  onOpenDashboard,
  onOpenExecutiveSignIn,
}: HeroSectionProps) {
  const totalWorkshops = db.roster.reduce((sum, r) => sum + r.workshopRegs, 0);
  const totalLeads = db.roster.reduce((sum, r) => sum + r.techLeads, 0);
  const anyRecruitmentOpen = hasAnyOpenRecruitmentRole(db.recruitmentStatus);
  const preferredApplyRole = db.recruitmentStatus.ca
    ? 'General Campus Ambassador'
    : getFirstOpenRecruitmentRoleTitle(db.recruitmentStatus) || 'General Campus Ambassador';

  return (
    <section className="relative overflow-hidden swiss-grid border-b border-[#E2E5EB] dark:border-[#262B35]">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/75 via-transparent to-[#B51B27]/[0.05] dark:from-[#0D0F12]/85 dark:via-transparent dark:to-[#B51B27]/[0.09]" />
      <div className="hero-glow absolute inset-0 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Copy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center space-y-6"
          >
            <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-[#5A6270] dark:text-slate-400">
              <span className="w-6 h-[2px] bg-[#B51B27] shrink-0" aria-hidden="true" />
              <span>Campus Ambassador Program · People. Purpose. Possibility.</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.06] text-[#111318] dark:text-white text-balance max-w-2xl">
              Empowering Campuses. Engineering{' '}
              <span className="text-gradient-red">Tomorrow.</span>
            </h1>

            <p className="text-base text-[#5A6270] dark:text-slate-300 max-w-2xl leading-relaxed">
              The official nationwide student leadership network of{' '}
              <strong className="font-semibold text-[#111318] dark:text-white">
                Ulterior Engineering
              </strong>
              . Powered by personal role-verified accounts across our{' '}
              <strong className="font-semibold text-[#111318] dark:text-white">
                4-Tier ExCom Governance
              </strong>{' '}
              (Program Chair &amp; Company CEO, Secretary, 5 Core Team Leads, and General CAs) with
              real-time cloud sync and installable app support.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {anyRecruitmentOpen ? (
                <button
                  type="button"
                  onClick={() => onApply(preferredApplyRole)}
                  className="btn-shine pressable inline-flex items-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Apply to Join Program</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex items-center gap-2 bg-[#E2E5EB] dark:bg-[#1E222B] text-[#5A6270] dark:text-slate-400 border border-[#D0D5DD] dark:border-[#2E3440] text-sm font-semibold px-6 py-3 rounded-lg whitespace-nowrap shrink-0 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>Recruitment Closed</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-2 bg-white dark:bg-[#15181E] hover:border-[#B51B27] text-[#111318] dark:text-white border border-[#E2E5EB] dark:border-[#262B35] text-sm font-semibold px-5 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {currentUser ? 'Open My Workspace' : 'Personal Portal Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Direct App Download Icon Button */}
              <PWAInstallButton variant="hero" />
            </div>

            {currentUser ? (
              <div className="inline-flex items-center gap-2 text-xs text-[#5A6270] dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Signed in as{' '}
                  <strong className="text-[#111318] dark:text-white">
                    {currentUser.email}
                  </strong>
                  {currentUser.assigned && currentUser.role
                    ? ` · Verified ${
                        currentUser.role === 'developer'
                          ? currentUser.isMainDeveloper
                            ? 'MAIN DEVELOPER (ROOT)'
                            : 'TIER 0 DEVELOPER'
                          : currentUser.role === 'ceo'
                          ? 'COMPANY CEO (CHAIR FULL ACCESS)'
                          : currentUser.role.toUpperCase()
                      } access`
                    : ' · Awaiting Developer / Chair / CEO role assignment'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5A6270] dark:text-slate-400">
                <button
                  type="button"
                  onClick={onOpenExecutiveSignIn}
                  className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#111318] dark:text-white hover:text-[#B51B27] underline underline-offset-4 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-[#B51B27] shrink-0" />
                  <span>Chair &amp; CEO Sign In</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex"
          >
            <div className="w-full glass-panel border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-[#5A6270] dark:text-slate-400 pb-3 border-b border-[#E2E5EB] dark:border-[#262B35]">
                  <span className="font-mono font-medium">01. Connected Campus Network</span>
                  <span className="font-mono text-[#B51B27] font-semibold">2026–2027</span>
                </div>

                <h2 className="font-display text-lg font-bold tracking-tight mt-4 text-[#111318] dark:text-white">
                  Where campus ambition meets real industrial engineering.
                </h2>
                <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-2 leading-relaxed">
                  Every ambassador operates across three measurable company pillars under strict
                  role-isolated ExCom governance.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-[#E2E5EB] dark:border-[#262B35]">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#B51B27]">01</div>
                    <div className="text-xs font-semibold text-[#111318] dark:text-white mt-1">
                      Workshops &amp; Courses
                    </div>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                      Referral-tracked bootcamps
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#B51B27]">02</div>
                    <div className="text-xs font-semibold text-[#111318] dark:text-white mt-1">
                      Tech Lead-Gen
                    </div>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                      FYDP, Robotics &amp; Hardware
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#B51B27]">03</div>
                    <div className="text-xs font-semibold text-[#111318] dark:text-white mt-1">
                      Campus Clubs
                    </div>
                    <div className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                      IEEE, EEE, CSE Seminars
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] space-y-2">
                <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400">
                  Root &amp; 4-Tier Access Control Hierarchy
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#111318] dark:text-slate-200">
                  <span className="text-[#B51B27]">0. Developer (Root)</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>1. Chair (Appointed)</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>2. Secretary</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>3. Scoped Leads</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>4. CAs</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5A6270] dark:text-slate-400 pt-2">
                  <span>Built in Bangladesh · Cloud-Synced Portal</span>
                  <a
                    href="https://ulteriorengineering.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B51B27] hover:underline font-medium"
                  >
                    Main Site
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Live Telemetry Strip */}
        <div className="mt-12 pt-8 border-t border-[#E2E5EB] dark:border-[#262B35] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              <AnimatedCounter value={24} suffix="+" />
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Target Partner Campuses across Squads A–E
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#B51B27]">
              <AnimatedCounter value={db.roster.length} />
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Active Verified Ambassadors on Roster
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              <AnimatedCounter value={totalWorkshops} />
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Referral-Tracked Workshop Registrations
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              <AnimatedCounter value={totalLeads} />
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Verified FYDP &amp; Hardware Tech Leads
            </div>
          </div>
        </div>

        <NextWorkshopCountdown db={db} />
      </div>
    </section>
  );
}

/** Live countdown to the next upcoming workshop (hidden when none is ahead). */
function NextWorkshopCountdown({ db }: { db: PortalDB }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = db.workshops
    .map((w) => ({ w, t: new Date(w.date).getTime() }))
    .filter((x) => Number.isFinite(x.t) && x.t > now)
    .sort((a, b) => a.t - b.t)[0];
  if (!next) return null;

  const diff = Math.max(0, next.t - now);
  const d = Math.floor(diff / 86400000);
  const hh = Math.floor((diff % 86400000) / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  const pad = (v: number) => String(v).padStart(2, '0');

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-[#B51B27]">
        <Timer className="w-4 h-4" aria-hidden="true" /> Next workshop
      </span>
      <span className="font-semibold text-[#111318] dark:text-white">{next.w.title}</span>
      <span className="text-[#5A6270] dark:text-slate-400">· {next.w.date}</span>
      <span className="font-mono tabular-nums font-bold text-[#111318] dark:text-white bg-[#B51B27]/10 rounded-md px-2 py-0.5">
        {d}d : {pad(hh)}h : {pad(mm)}m : {pad(ss)}s
      </span>
    </div>
  );
}
