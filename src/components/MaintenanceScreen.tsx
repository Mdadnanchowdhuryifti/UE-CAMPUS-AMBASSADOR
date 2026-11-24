import { AlertTriangle, Ban, ShieldAlert, Terminal, Wrench, X } from 'lucide-react';
import { BlockedSessionNotice, SystemConfig } from '../types';

interface MaintenanceScreenProps {
  config: SystemConfig;
  signingIn: boolean;
  onDeveloperSignIn: () => Promise<void>;
  onOpenAdminRoute: () => void;
}

export function MaintenanceScreen({
  config,
  signingIn,
  onDeveloperSignIn,
  onOpenAdminRoute,
}: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D0F12] text-[#111318] dark:text-slate-100 swiss-grid flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-xl w-full bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-2xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#E2E5EB] dark:border-[#262B35] pb-5">
          <div className="flex items-center gap-2.5">
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
              <rect
                x="29.5"
                y="4"
                width="14"
                height="5.8"
                className="fill-[#111318] dark:fill-white"
              />
              <rect x="29.5" y="14.1" width="11.5" height="5.8" fill="#B51B27" />
              <rect
                x="29.5"
                y="24.2"
                width="14"
                height="5.8"
                className="fill-[#111318] dark:fill-white"
              />
            </svg>
            <span className="font-display font-extrabold tracking-tight text-base text-[#111318] dark:text-white">
              Ulterior Engineering
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
            <Wrench className="w-3.5 h-3.5" />
            <span>MAINTENANCE</span>
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#B51B27] font-semibold">
            Scheduled Platform Maintenance · config/system
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111318] dark:text-white">
            Portal Temporarily Unavailable
          </h1>
          <p className="text-sm text-[#5A6270] dark:text-slate-300 leading-relaxed">
            {config.maintenanceMessage}
          </p>
        </div>

        {config.emergencyLockdown && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
            <span>
              <strong>Emergency Read-Only Lockdown Active:</strong> {config.lockdownMessage}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-[#E2E5EB] dark:border-[#262B35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono text-[#5A6270] dark:text-slate-400">
            ca.ulteriorengineering.com
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={signingIn}
              onClick={() => {
                onOpenAdminRoute();
                void onDeveloperSignIn();
              }}
              className="inline-flex items-center gap-1.5 bg-[#111318] hover:bg-[#B51B27] disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{signingIn ? 'Verifying...' : 'Developer Sign In (/admin)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SystemStatusBannerProps {
  config: SystemConfig;
  isDeveloper: boolean;
  onOpenAdmin: () => void;
}

export function SystemStatusBanner({
  config,
  isDeveloper,
  onOpenAdmin,
}: SystemStatusBannerProps) {
  if (!config.emergencyLockdown && !(config.maintenanceMode && isDeveloper)) {
    return null;
  }

  return (
    <div
      role="status"
      className={`text-white text-xs sm:text-sm py-2.5 px-4 ${
        config.emergencyLockdown ? 'bg-[#B51B27]' : 'bg-amber-600'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {config.emergencyLockdown ? (
            <ShieldAlert className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>
            {config.emergencyLockdown ? (
              <>
                <strong className="font-semibold">Emergency Read-Only Lockdown Active:</strong>{' '}
                {config.lockdownMessage}
              </>
            ) : (
              <>
                <strong className="font-semibold">Maintenance Mode Enabled:</strong> Non-developer
                visitors currently see the Maintenance Page.
              </>
            )}
          </span>
        </div>
        {isDeveloper && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="bg-white text-[#111318] font-semibold px-3 py-1 rounded text-xs hover:bg-slate-100 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            Manage in /admin
          </button>
        )}
      </div>
    </div>
  );
}

interface AccountBlockedModalProps {
  notice: BlockedSessionNotice | null;
  onDismiss: () => void;
}

export function AccountBlockedModal({ notice, onDismiss }: AccountBlockedModalProps) {
  if (!notice) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="blocked-session-title"
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-[#15181E] border border-red-300 dark:border-red-900/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#B51B27] flex items-center justify-center shrink-0">
              {notice.type === 'banned' ? (
                <Ban className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-mono font-semibold uppercase text-[#B51B27]">
                {notice.type === 'lockdown'
                  ? 'Emergency Lockdown'
                  : notice.type === 'banned'
                  ? 'Account Banned'
                  : 'Account Suspended'}
              </div>
              <h3
                id="blocked-session-title"
                className="font-display text-base font-extrabold text-[#111318] dark:text-white"
              >
                {notice.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close notice"
            className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
          {notice.reason}
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-[#111318] dark:bg-[#B51B27] hover:bg-[#B51B27] dark:hover:bg-[#92141E] text-white text-xs font-semibold py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}
