import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Download,
  Flag,
  GraduationCap,
  Home,
  LogIn,
  LucideIcon,
  Network,
  Trophy,
  Users,
} from 'lucide-react';

export interface PortalRouteMeta {
  path: string;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const PORTAL_PAGES: PortalRouteMeta[] = [
  {
    path: '/',
    label: 'Home',
    shortLabel: 'Home',
    title: 'Home',
    description:
      'Official nationwide student leadership portal of Ulterior Engineering.',
    icon: Home,
  },
  {
    path: '/architecture',
    label: 'Architecture',
    shortLabel: 'Architecture',
    title: 'Architecture',
    description:
      'Interactive 4-tier governance chain of command, reporting lines, and KPI mandates.',
    icon: Network,
  },
  {
    path: '/excom',
    label: 'ExCom',
    shortLabel: 'ExCom',
    title: 'ExCom',
    description:
      'Executive Committee portfolios starting from Tier 2 Secretary through Tier 3 Core Team Leads.',
    icon: Users,
  },
  {
    path: '/squads',
    label: 'Campus Squads A–E',
    shortLabel: 'Squads',
    title: 'Squads',
    description:
      'Five regional campus execution squads, active ambassador rosters, and weekly cadence.',
    icon: Flag,
  },
  {
    path: '/leaderboard',
    label: 'Live KPI Leaderboard',
    shortLabel: 'Leaderboard',
    title: 'Leaderboard',
    description:
      'Real-time monthly squad standings, verified ambassador points, and CSV roster exports.',
    icon: Trophy,
  },
  {
    path: '/workshops',
    label: 'Workshops',
    shortLabel: 'Workshops',
    title: 'Workshops',
    description:
      'Flagship technical bootcamps and workshops with automated ambassador referral tracking.',
    icon: GraduationCap,
  },
  {
    path: '/verify',
    label: 'Verify Credentials & Clubs',
    shortLabel: 'Verify & Clubs',
    title: 'Verify Credentials & Clubs',
    description:
      'Live LinkedIn-verifiable certificate lookup and campus club partnership proposals.',
    icon: BadgeCheck,
  },
  {
    path: '/download',
    label: 'Download App',
    shortLabel: 'Download',
    title: 'Download App',
    description:
      'Install the UE CA Portal as an offline-ready Progressive Web App on mobile or desktop.',
    icon: Download,
  },
  {
    path: '/signin',
    label: 'Portal Sign In',
    shortLabel: 'Sign In',
    title: 'Portal Sign In',
    description:
      'Role-locked Google authentication for ExCom, Tier 1 Chair & CEO, Core Leads, and CAs.',
    icon: LogIn,
  },
];

export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `${pageTitle} – Ulterior Engineering`;
  }, [pageTitle]);
}

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  kicker?: string;
}

export function PageHeader({ icon: Icon, title, description, kicker }: PageHeaderProps) {
  return (
    <div className="border-b border-[#E2E5EB] dark:border-[#262B35] bg-white/75 dark:bg-[#15181E]/75 swiss-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#B51B27]/12 dark:bg-[#B51B27]/20 border border-[#B51B27]/30 text-[#B51B27] flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.1} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            {kicker && (
              <div className="text-xs font-mono font-semibold text-[#B51B27] mb-1">
                {kicker}
              </div>
            )}
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111318] dark:text-white text-balance">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-[#5A6270] dark:text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageNavFooterProps {
  currentPath: string;
}

export function PageNavFooter({ currentPath }: PageNavFooterProps) {
  const idx = PORTAL_PAGES.findIndex((p) => p.path === currentPath);
  if (idx === -1) return null;

  const prev = idx > 0 ? PORTAL_PAGES[idx - 1] : null;
  const next = idx < PORTAL_PAGES.length - 1 ? PORTAL_PAGES[idx + 1] : null;

  return (
    <nav
      aria-label="Page navigation"
      className="border-t border-[#E2E5EB] dark:border-[#262B35] bg-[#F4F5F7] dark:bg-[#0D0F12]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prev ? (
            <Link
              to={prev.path}
              className="group min-h-[60px] flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-center text-[#5A6270] dark:text-slate-400 group-hover:text-[#B51B27] group-hover:border-[#B51B27]/40 transition-colors duration-150 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                  Previous page
                </div>
                <div className="font-display text-sm font-bold text-[#111318] dark:text-white group-hover:text-[#B51B27] transition-colors duration-150 truncate">
                  {prev.label}
                </div>
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" aria-hidden="true" />
          )}

          {next ? (
            <Link
              to={next.path}
              className="group min-h-[60px] flex items-center justify-between gap-3.5 p-4 rounded-xl bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] hover:border-[#B51B27] transition-colors duration-150 sm:text-right focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
            >
              <div className="min-w-0 sm:ml-auto">
                <div className="text-[11px] font-mono text-[#5A6270] dark:text-slate-400">
                  Next page
                </div>
                <div className="font-display text-sm font-bold text-[#111318] dark:text-white group-hover:text-[#B51B27] transition-colors duration-150 truncate">
                  {next.label}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#F4F5F7] dark:bg-[#0D0F12] border border-[#E2E5EB] dark:border-[#262B35] flex items-center justify-center text-[#5A6270] dark:text-slate-400 group-hover:text-[#B51B27] group-hover:border-[#B51B27]/40 transition-colors duration-150 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" aria-hidden="true" />
          )}
        </div>
      </div>
    </nav>
  );
}

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#E2E5EB] dark:bg-[#1E222B]" />
        <div className="space-y-2 flex-1 max-w-md">
          <div className="h-5 w-48 rounded bg-[#E2E5EB] dark:bg-[#1E222B]" />
          <div className="h-3.5 w-full rounded bg-[#E2E5EB]/70 dark:bg-[#1E222B]/70" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <div className="h-44 rounded-xl bg-[#E2E5EB]/60 dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35]" />
        <div className="h-44 rounded-xl bg-[#E2E5EB]/60 dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35]" />
        <div className="h-44 rounded-xl bg-[#E2E5EB]/60 dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35]" />
      </div>
    </div>
  );
}
