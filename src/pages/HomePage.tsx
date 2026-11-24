import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Download,
  Flag,
  GraduationCap,
  Network,
  Trophy,
  Users,
} from 'lucide-react';
import { HeroSection } from '../components/HeroSection';
import { PrevNext } from '../components/PrevNext';
import { usePageTitle } from '../hooks/usePageTitle';
import { PortalDB, PortalUser, SquadName } from '../types';

interface HomePageProps {
  db: PortalDB;
  currentUser: PortalUser | null;
  onApply: (role: string, squad?: SquadName) => void;
  onOpenDashboard: () => void;
  onOpenExecutiveSignIn: () => void;
}

const HIGHLIGHTS = [
  {
    path: '/architecture',
    icon: Network,
    title: 'Architecture',
    description: 'The 4-tier governance structure behind the program.',
  },
  {
    path: '/excom',
    icon: Users,
    title: 'ExCom',
    description: 'Program leadership and role-locked executive portals.',
  },
  {
    path: '/squads',
    icon: Flag,
    title: 'Squads',
    description: 'Campus Squads A–E and their weekly operating cadence.',
  },
  {
    path: '/leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Live KPI leaderboard across all squads and ambassadors.',
  },
  {
    path: '/workshops',
    icon: GraduationCap,
    title: 'Workshops',
    description: 'Upcoming workshops with referral-tracked registration.',
  },
  {
    path: '/verify',
    icon: BadgeCheck,
    title: 'Verify Credentials & Clubs',
    description: 'Check certificates and pitch your club for a collaboration.',
  },
  {
    path: '/download',
    icon: Download,
    title: 'Download App',
    description: 'Install the portal as an app on your phone or desktop.',
  },
];

/** Home: short hero + highlights and a card linking to each page. */
export default function HomePage({
  db,
  currentUser,
  onApply,
  onOpenDashboard,
  onOpenExecutiveSignIn,
}: HomePageProps) {
  usePageTitle('Home – Ulterior Engineering');

  return (
    <>
      <HeroSection
        db={db}
        currentUser={currentUser}
        onApply={onApply}
        onOpenDashboard={onOpenDashboard}
        onOpenExecutiveSignIn={onOpenExecutiveSignIn}
      />

      <section className="py-14 lg:py-16 border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs font-mono font-semibold text-[#B51B27]">Explore the Portal</div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-[#111318] dark:text-white">
            Everything, on its own page
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {HIGHLIGHTS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-5 flex items-start gap-4 hover:border-[#B51B27] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
              >
                <span className="w-11 h-11 rounded-lg bg-[#B51B27]/10 text-[#B51B27] flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display font-bold text-sm text-[#111318] dark:text-white">
                    {item.title}
                    <ArrowRight
                      className="w-3.5 h-3.5 text-[#B51B27] group-hover:translate-x-0.5 transition-transform duration-150"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="block text-xs text-[#5A6270] dark:text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PrevNext current="/" />
    </>
  );
}
