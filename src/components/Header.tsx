import { useState } from 'react';
import { Menu, Terminal, X } from 'lucide-react';
import { Ambassador, PortalUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  detectedRefCode: string;
  referringCA: Ambassador | undefined;
  currentUser: PortalUser | null;
  authLoading: boolean;
  onOpenAuthOrDashboard: () => void;
  onOpenAdminPage: () => void;
}

export function Header({
  detectedRefCode,
  referringCA,
  currentUser,
  authLoading,
  onOpenAuthOrDashboard,
  onOpenAdminPage,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '#architecture', label: 'Architecture' },
    { href: '#excom', label: 'ExCom' },
    { href: '#squads', label: 'Squads' },
    { href: '#leaderboard', label: 'Leaderboard' },
    { href: '#workshops', label: 'Workshops' },
  ];

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
            <a
              href="#workshops"
              className="bg-white text-[#B51B27] font-semibold px-3 py-1 rounded text-xs hover:bg-slate-100 transition whitespace-nowrap shrink-0"
            >
              View Workshops
            </a>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 glass-panel border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#"
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
              <rect x="29.5" y="4" width="14" height="5.8" className="fill-[#111318] dark:fill-white" />
              <rect x="29.5" y="14.1" width="11.5" height="5.8" fill="#B51B27" />
              <rect x="29.5" y="24.2" width="14" height="5.8" className="fill-[#111318] dark:fill-white" />
            </svg>
            <span className="font-display font-extrabold tracking-tight text-base text-[#111318] dark:text-white">
              Ulterior Engineering
            </span>
          </a>

          {/* Zone 2: 5 Single-line Nav Links */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#5A6270] dark:text-slate-300"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-[#B51B27] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: 1 Primary Action (+ Developer /admin shortcut) + Mobile Drawer Toggle */}
          <div className="flex items-center gap-2 shrink-0">
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
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] text-[#111318] dark:text-white cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] px-4 py-3 space-y-1 text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-[#111318] dark:text-slate-100 hover:text-[#B51B27]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#verify"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[#111318] dark:text-slate-100 hover:text-[#B51B27]"
            >
              Verify Credentials &amp; Clubs
            </a>
            <div className="pt-2 pb-1">
              <PWAInstallButton variant="compact" />
            </div>
            <a
              href="https://ulteriorengineering.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-[#5A6270] dark:text-slate-400 hover:text-[#B51B27]"
            >
              Back to Main Website
            </a>
          </div>
        )}
      </header>
    </>
  );
}
