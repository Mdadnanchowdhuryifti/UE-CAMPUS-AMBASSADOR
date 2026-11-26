import { Link } from 'react-router-dom';
import { Terminal, UserRound, Users } from 'lucide-react';
import { Ambassador, PortalUser } from '../types';
import { AnnouncementTicker, DesktopTopNav, NotificationBell } from './AppNavigation';

interface HeaderProps {
  detectedRefCode: string;
  referringCA: Ambassador | undefined;
  currentUser: PortalUser | null;
  authLoading: boolean;
  onOpenAuthOrDashboard: () => void;
  onOpenAdminPage: () => void;
  onNavigatePath?: (path: string) => void;
}

export function Header({
  detectedRefCode,
  referringCA,
  currentUser,
  authLoading,
  onOpenAuthOrDashboard,
  onOpenAdminPage,
}: HeaderProps) {
  const canManageMembers =
    currentUser?.role === 'chair' ||
    currentUser?.role === 'secretary' ||
    currentUser?.role === 'developer';

  const getPrimaryLabel = () => {
    if (authLoading) return 'Checking Session...';
    if (!currentUser) return 'Portal Sign In';
    if (!currentUser.assigned || !currentUser.role) return 'My Account';
    if (currentUser.role === 'developer') {
      return currentUser.isMainDeveloper ? 'Main Dev Console' : 'Developer Console';
    }
    if (currentUser.role === 'ceo') return 'CEO Console';
    if (currentUser.role === 'chair') return 'Chair Console';
    if (currentUser.role === 'secretary') return 'Secretary Hub';
    if (currentUser.role.startsWith('lead')) {
      return `Lead ${currentUser.role.replace('lead', '')} Portal`;
    }
    return 'My CA Portal';
  };

  return (
    <>
      {detectedRefCode && (
        <div className="bg-[#B51B27] text-white text-xs sm:text-sm py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span>
              Referred by Campus Ambassador{' '}
              <strong className="font-semibold">
                {referringCA
                  ? `${referringCA.name} (${referringCA.campus})`
                  : 'Verified Ambassador'}
              </strong>{' '}
              (<span className="font-mono underline">{detectedRefCode}</span>). Your workshop
              registration will be tracked automatically.
            </span>
            <Link
              to="/workshops"
              className="bg-white text-[#B51B27] font-semibold px-3 py-1 rounded text-xs hover:bg-slate-100 transition whitespace-nowrap shrink-0"
            >
              View Workshops
            </Link>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            aria-label="Ulterior Engineering — Home"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-4 rounded"
          >
            <svg
              width="34"
              height="26"
              viewBox="0 0 46 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 4H10V20.5C10 23.2 11.7 24.8 14.3 24.8C16.9 24.8 18.6 23.2 18.6 20.5V4H25.6V20.8C25.6 27.6 21.1 31.4 14.3 31.4C7.5 31.4 3 27.6 3 20.8V4Z"
                className="fill-[#111318] dark:fill-white"
              />
              {/* Grey blob inside the U bowl — official UE mark detail */}
              <path
                d="M9.8 24.6 C9.4 21.8 10.6 19.9 12.2 19.5 C13.7 19.1 14.8 20.4 14.4 22 C14.2 22.9 15 23.2 15.9 22.8 C17.2 22.2 18.3 23 18.1 24.4 C17.9 26.3 16.2 27.3 13.9 27.1 C11.7 26.9 10.1 26.1 9.8 24.6 Z"
                fill="#9AA3AD"
              />
              {/* E: three red bars, no stem — official UE mark */}
              <rect x="29.5" y="4" width="14" height="5.8" fill="#ED1C24" />
              <rect x="29.5" y="14.1" width="11.5" height="5.8" fill="#ED1C24" />
              <rect x="29.5" y="24.2" width="14" height="5.8" fill="#ED1C24" />
            </svg>
            <span className="font-display font-extrabold tracking-tight text-base text-[#111318] dark:text-white">
              Ulterior Engineering
            </span>
          </Link>

          {/* Zone 2: Facebook-style centred icon navigation (desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-2">
            <DesktopTopNav />
            {currentUser && (
              <Link
                to="/profile"
                aria-label="My Profile"
                title="My Profile"
                className="inline-flex items-center justify-center w-12 h-11 min-w-[44px] min-h-[44px] rounded-lg text-[#5A6270] dark:text-slate-400 hover:text-[#B51B27] dark:hover:text-white hover:bg-[#B51B27]/10 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
              >
                <UserRound className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}
            {currentUser && canManageMembers && (
              <Link
                to="/members"
                aria-label="Manage Members"
                title="Manage Members"
                className="inline-flex items-center justify-center w-12 h-11 min-w-[44px] min-h-[44px] rounded-lg text-[#5A6270] dark:text-slate-400 hover:text-[#B51B27] dark:hover:text-white hover:bg-[#B51B27]/10 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
              >
                <Users className="w-5 h-5" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/* Zone 3: Notifications + Primary Action (+ Developer /admin shortcut) */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell currentUser={currentUser} />
            {currentUser?.role === 'developer' && (
              <button
                type="button"
                onClick={onOpenAdminPage}
                className="inline-flex items-center gap-1.5 bg-[#111318] hover:bg-[#B51B27] dark:bg-slate-800 dark:hover:bg-[#B51B27] text-white text-xs font-mono font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-[#B51B27] group-hover:text-white" />
                <span>/admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAuthOrDashboard}
              disabled={authLoading}
              className="bg-[#B51B27] hover:bg-[#92141E] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
            >
              {getPrimaryLabel()}
            </button>
          </div>
        </div>
        {/* Mobile navigation lives in the fixed bottom tab bar (MobileBottomNav). */}
      </header>
      <AnnouncementTicker currentUser={currentUser} />
    </>
  );
}
