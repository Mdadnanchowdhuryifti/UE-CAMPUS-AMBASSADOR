import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Download,
  Flag,
  GraduationCap,
  Home,
  LayoutGrid,
  LogIn,
  LucideIcon,
  Network,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { PortalUser } from '../types';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/architecture', label: 'Architecture', icon: Network },
  { path: '/excom', label: 'ExCom', icon: Users },
  { path: '/squads', label: 'Squads', icon: Flag },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/workshops', label: 'Workshops', icon: GraduationCap },
  { path: '/verify', label: 'Verify Credentials & Clubs', icon: BadgeCheck },
  { path: '/download', label: 'Download App', icon: Download },
];

/** Placeholder notification count (no notification system yet). */
export const NOTIFICATION_COUNT = 3;

/** Bell button with a small red unread-count badge. */
export function NotificationBell() {
  return (
    <button
      type="button"
      aria-label={`Notifications, ${NOTIFICATION_COUNT} unread`}
      title="Notifications"
      className="relative inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-[#5A6270] dark:text-slate-300 hover:text-[#B51B27] dark:hover:text-white hover:bg-[#B51B27]/10 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
    >
      <Bell className="w-5 h-5" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B51B27] text-white text-[10px] font-bold flex items-center justify-center"
      >
        {NOTIFICATION_COUNT}
      </span>
    </button>
  );
}

/** Facebook-style centred icon navigation for the desktop top bar. */
export function DesktopTopNav() {
  return (
    <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          aria-label={item.label}
          className="group relative inline-flex items-center justify-center w-12 h-11 min-w-[44px] min-h-[44px] rounded-lg focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
        >
          {({ isActive }) => (
            <>
              <item.icon
                aria-hidden="true"
                className={`w-5 h-5 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#B51B27]'
                    : 'text-[#5A6270] dark:text-slate-400 group-hover:text-[#B51B27] dark:group-hover:text-white'
                }`}
                fill={isActive ? 'currentColor' : 'none'}
              />
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-2 right-2 -bottom-[9px] h-[3px] rounded-full bg-[#B51B27]"
                />
              )}
              <span
                role="tooltip"
                className="pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111318] text-white text-xs font-medium px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

const BOTTOM_TABS: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/excom', label: 'ExCom', icon: Users },
  { path: '/squads', label: 'Squads', icon: Flag },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

interface MobileBottomNavProps {
  currentUser: PortalUser | null;
}

/** Fixed mobile bottom tab bar (Home, ExCom, Squads, Leaderboard, Menu) with a slide-up Menu sheet. */
export function MobileBottomNav({ currentUser }: MobileBottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const canManageMembers =
    currentUser?.role === 'chair' ||
    currentUser?.role === 'secretary' ||
    currentUser?.role === 'developer';

  const sheetLinkClass =
    'flex items-center gap-3 w-full px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium text-[#111318] dark:text-slate-100 hover:bg-[#B51B27]/10 hover:text-[#B51B27] transition-colors duration-150';

  return (
    <>
      <nav
        aria-label="Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#15181E]/95 backdrop-blur border-t border-[#E2E5EB] dark:border-[#262B35] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5">
          {BOTTOM_TABS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              aria-label={item.label}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-[-2px]"
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    aria-hidden="true"
                    className={`w-5 h-5 transition-colors duration-150 ${
                      isActive ? 'text-[#B51B27]' : 'text-[#5A6270] dark:text-slate-400'
                    }`}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  <span
                    className={`text-[10px] font-medium leading-none ${
                      isActive ? 'text-[#B51B27]' : 'text-[#5A6270] dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#B51B27]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="relative flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] text-[#5A6270] dark:text-slate-400 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-[-2px]"
          >
            <LayoutGrid className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">Menu</span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 w-full h-full bg-black/50 cursor-pointer"
          />
          <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-[#15181E] border-t border-[#E2E5EB] dark:border-[#262B35] rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)] animate-[slide-up_150ms_ease-out]">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="font-display font-extrabold text-sm text-[#111318] dark:text-white">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-[#5A6270] dark:text-slate-300 hover:text-[#B51B27] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="px-2 pb-4 space-y-0.5">
              <Link to="/architecture" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                <Network className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                Architecture
              </Link>
              <Link to="/workshops" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                <GraduationCap className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                Workshops
              </Link>
              <Link to="/verify" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                <BadgeCheck className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                Verify Credentials &amp; Clubs
              </Link>
              <Link to="/download" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                <Download className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                Download App
              </Link>
              {currentUser && (
                <Link to="/profile" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                  <UserRound className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                  My Profile
                </Link>
              )}
              {currentUser && canManageMembers && (
                <Link to="/members" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                  <Users className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                  Manage Members
                </Link>
              )}
              {!currentUser && (
                <Link to="/signin" onClick={() => setMenuOpen(false)} className={sheetLinkClass}>
                  <LogIn className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                  Portal Sign In
                </Link>
              )}
              <a
                href="https://ulteriorengineering.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={sheetLinkClass}
              >
                <ArrowLeft className="w-5 h-5 text-[#B51B27]" aria-hidden="true" />
                Back to Main Website
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
