import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const PAGE_ORDER: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/architecture', label: 'Architecture' },
  { path: '/excom', label: 'ExCom' },
  { path: '/squads', label: 'Squads' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/workshops', label: 'Workshops' },
  { path: '/verify', label: 'Verify Credentials & Clubs' },
  { path: '/download', label: 'Download App' },
  { path: '/signin', label: 'Portal Sign In' },
];

interface PrevNextProps {
  current: string;
}

/** Previous / Next page links rendered at the bottom of every public page. */
export function PrevNext({ current }: PrevNextProps) {
  const idx = PAGE_ORDER.findIndex((p) => p.path === current);
  if (idx === -1) return null;
  const prev = idx > 0 ? PAGE_ORDER[idx - 1] : null;
  const next = idx < PAGE_ORDER.length - 1 ? PAGE_ORDER[idx + 1] : null;

  const linkClass =
    'inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] hover:text-[#B51B27] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2';

  return (
    <nav
      aria-label="More pages"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between gap-4"
    >
      <div>
        {prev && (
          <Link to={prev.path} className={linkClass} aria-label={`Previous page: ${prev.label}`}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>
              <span className="block text-[10px] font-mono uppercase tracking-wide text-[#5A6270] dark:text-slate-400">
                Previous
              </span>
              {prev.label}
            </span>
          </Link>
        )}
      </div>
      <div>
        {next && (
          <Link to={next.path} className={linkClass} aria-label={`Next page: ${next.label}`}>
            <span className="text-right">
              <span className="block text-[10px] font-mono uppercase tracking-wide text-[#5A6270] dark:text-slate-400">
                Next
              </span>
              {next.label}
            </span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}
