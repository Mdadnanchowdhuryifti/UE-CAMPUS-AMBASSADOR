import { useEffect, useRef, useState } from 'react';
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
  Megaphone,
  LogIn,
  LucideIcon,
  Network,
  Send,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { PortalUser } from '../types';
import {
  Announcement,
  canAnnounce,
  postAnnouncement,
  subscribeAnnouncements,
} from '../services/announcementService';

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

const ROLE_LABELS: Record<string, string> = {
  developer: 'Developer',
  chair: 'Chair',
  ceo: 'CEO',
  secretary: 'Secretary',
  lead1: 'Squad A Lead',
  lead2: 'Squad B Lead',
  lead3: 'Squad C Lead',
  lead4: 'Squad D Lead',
  lead5: 'Squad E Lead',
  ca: 'Campus Ambassador',
};

/**
 * Bell button with a live unread badge. Opens the announcements panel:
 * every signed-in member sees announcements posted by the Chair,
 * Secretary, CEO, Leads or developer, and those roles can post a new
 * announcement (which is also emailed to all members) from the panel.
 */
export function NotificationBell({
  currentUser,
}: {
  currentUser: PortalUser | null;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Announcement[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [postNote, setPostNote] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const seenKey = currentUser ? `ue-ann-seen-${currentUser.uid}` : null;

  useEffect(() => {
    if (!seenKey) return;
    const raw = window.localStorage.getItem(seenKey);
    setLastSeen(raw ? Number(raw) || 0 : 0);
  }, [seenKey]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeAnnouncements(setItems, () => setItems([]));
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open ]);

  const unread = currentUser
    ? items.filter(
        (it) =>
          it.createdAt &&
          it.createdAt.getTime() > lastSeen &&
          it.authorUid !== currentUser.uid
      ).length
    : 0;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && seenKey) {
      const now = Date.now();
      window.localStorage.setItem(seenKey, String(now));
      setLastSeen(now);
    }
  };

  const handlePost = async () => {
    if (!currentUser || posting) return;
    setPosting(true);
    setPostNote(null);
    try {
      const res = await postAnnouncement({ author: currentUser, title, message });
      setTitle('');
      setMessage('');
      setPostNote(
        res.emailConfigured
          ? `Announcement posted and emailed to ${res.emailedCount} member(s).`
          : 'Announcement posted. (Email is not set up yet, so it was not emailed.)'
      );
    } catch (err) {
      setPostNote(
        err instanceof Error ? err.message : 'Announcement could not be posted.'
      );
    } finally {
      setPosting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3 py-2 text-sm text-[#111318] dark:text-white placeholder:text-[#5A6270] focus:outline-none focus:ring-2 focus:ring-[#B51B27]/60';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        title="Notifications"
        className="relative inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg text-[#5A6270] dark:text-slate-300 hover:text-[#B51B27] dark:hover:text-white hover:bg-[#B51B27]/10 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="badge-pulse absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B51B27] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[86vw] max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-[72px] max-sm:w-auto max-sm:max-w-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12151C] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-2 text-sm font-bold text-[#111318] dark:text-white">
              <Megaphone className="w-4 h-4 text-[#B51B27]" /> Announcements
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#5A6270] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!currentUser ? (
            <p className="px-4 py-6 text-sm text-[#5A6270] dark:text-slate-400">
              Sign in to see announcements.
            </p>
          ) : (
            <>
              {canAnnounce(currentUser) && (
                <div className="px-4 py-3 space-y-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <input
                    className={inputClass}
                    placeholder="Announcement title"
                    value={title}
                    maxLength={120}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className={`${inputClass} resize-none`}
                    placeholder="Write the announcement for all members…"
                    value={message}
                    rows={3}
                    maxLength={2000}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handlePost}
                    disabled={posting || !title.trim() || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#B51B27] px-3 py-2 text-sm font-semibold text-white hover:bg-[#9c1620] disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {posting ? 'Posting…' : 'Post announcement'}
                  </button>
                  {postNote && (
                    <p className="text-[11px] text-[#5A6270] dark:text-slate-400">{postNote}</p>
                  )}
                </div>
              )}

              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[#5A6270] dark:text-slate-400">
                    No announcements yet.
                  </p>
                ) : (
                  items.map((it) => (
                    <article
                      key={it.id}
                      className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                    >
                      <h3 className="text-sm font-bold text-[#111318] dark:text-white">
                        {it.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#374151] dark:text-slate-300 whitespace-pre-line">
                        {it.message}
                      </p>
                      <p className="mt-2 text-[11px] text-[#5A6270] dark:text-slate-500">
                        {it.authorName}
                        {it.authorRole ? ` · ${ROLE_LABELS[it.authorRole] || it.authorRole}` : ''}
                        {it.createdAt
                          ? ` · ${it.createdAt.toLocaleString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
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
                className={`w-5 h-5 transition-all duration-150 group-hover:scale-110 ${
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
                    className={`w-5 h-5 transition-all duration-150 group-hover:scale-110 ${
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


/**
 * Live announcement ticker under the header: scrolls the latest
 * announcement titles for signed-in members. Renders nothing when
 * there are no announcements (or the visitor is signed out).
 */
export function AnnouncementTicker({ currentUser }: { currentUser: PortalUser | null }) {
  const [items, setItems] = useState<Announcement[]>([]);
  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      return;
    }
    const unsub = subscribeAnnouncements(setItems, () => setItems([]));
    return unsub;
  }, [currentUser]);

  if (!currentUser || items.length === 0) return null;
  const latest = items.slice(0, 5);
  const line = latest.map((a) => `${a.title} — ${a.message}`).join('  •  ');
  return (
    <div className="bg-[#B51B27] text-white overflow-hidden" role="marquee" aria-label="Latest announcements">
      <div className="flex items-center">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#92141E] text-[11px] font-bold uppercase tracking-wide shrink-0">
          <Megaphone className="w-3.5 h-3.5" aria-hidden="true" /> Live
        </span>
        <div className="relative flex-1 overflow-hidden py-1.5">
          <div className="animate-marquee whitespace-nowrap text-xs font-medium will-change-transform inline-block pl-3">
            <span>{line}</span>
            <span aria-hidden="true">{'  •  ' + line}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
