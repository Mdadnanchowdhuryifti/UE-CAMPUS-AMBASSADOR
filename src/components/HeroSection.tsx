import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PortalDB } from '../types';

interface HeroSectionProps {
  db: PortalDB;
  onApply: (role: string) => void;
  onOpenDashboard: () => void;
}

export function HeroSection({ db, onApply, onOpenDashboard }: HeroSectionProps) {
  const totalWorkshops = db.roster.reduce((sum, r) => sum + r.workshopRegs, 0);
  const totalLeads = db.roster.reduce((sum, r) => sum + r.techLeads, 0);

  return (
    <section className="relative overflow-hidden swiss-grid border-b border-[#E2E5EB] dark:border-[#262B35]">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/75 via-transparent to-[#B51B27]/[0.04] dark:from-[#0D0F12]/85 dark:via-transparent dark:to-[#B51B27]/[0.08]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-[#5A6270] dark:text-slate-400">
              <span className="w-6 h-[2px] bg-[#B51B27] shrink-0" aria-hidden="true" />
              <span>Campus Ambassador Program · People. Purpose. Possibility.</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.06] text-[#111318] dark:text-white text-balance max-w-2xl">
              Empowering Campuses. Engineering{' '}
              <span className="text-[#B51B27]">Tomorrow.</span>
            </h1>

            <p className="text-base text-[#5A6270] dark:text-slate-300 max-w-2xl leading-relaxed">
              The official nationwide student leadership network of{' '}
              <strong className="font-semibold text-[#111318] dark:text-white">
                Ulterior Engineering
              </strong>
              . Structured on a disciplined{' '}
              <strong className="font-semibold text-[#111318] dark:text-white">
                4-Tier ExCom Architecture
              </strong>{' '}
              (Program Chair, Secretary, 5 Core Team Leads, and General CAs), connecting
              engineering education, technical project execution, and industry across Bangladesh.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onApply('General Campus Ambassador')}
                className="inline-flex items-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Apply to Join Program</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="inline-flex items-center gap-2 bg-white dark:bg-[#15181E] hover:border-[#B51B27] text-[#111318] dark:text-white border border-[#E2E5EB] dark:border-[#262B35] text-sm font-semibold px-5 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Open CA / ExCom Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#architecture"
                className="text-sm font-medium text-[#5A6270] dark:text-slate-400 hover:text-[#B51B27] px-2 py-2 transition-colors whitespace-nowrap shrink-0"
              >
                Inspect 4-Tier Tree
              </a>
            </div>
          </div>

          {/* Right Overview Card */}
          <div className="lg:col-span-5 flex">
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
                  Every ambassador operates across three measurable company pillars under
                  coordinated ExCom supervision.
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
                  4-Tier Chain of Command
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#111318] dark:text-slate-200">
                  <span>1. Program Chair</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>2. Secretary</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>3. 5 Core Leads</span>
                  <span className="text-[#B51B27]" aria-hidden="true">→</span>
                  <span>4. General CAs</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5A6270] dark:text-slate-400 pt-2">
                  <span>Built in Bangladesh · Engineered for Impact</span>
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
          </div>
        </div>

        {/* Full-Width 4-Column Live Program Telemetry Strip below the Hero Split */}
        <div className="mt-12 pt-8 border-t border-[#E2E5EB] dark:border-[#262B35] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              24+
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Target Partner Campuses across Squads A–E
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#B51B27]">
              {db.roster.length}
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Active Verified Ambassadors on Roster
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              {totalWorkshops}
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Referral-Tracked Workshop Registrations
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-[#111318] dark:text-white">
              {totalLeads}
            </div>
            <div className="text-xs font-medium text-[#5A6270] dark:text-slate-400 mt-1">
              Verified FYDP &amp; Hardware Tech Leads
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
