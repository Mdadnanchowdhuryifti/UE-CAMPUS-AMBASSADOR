import { useState } from 'react';
import { Download, Smartphone, WifiOff, X, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'hero' | 'compact';
}

export function PWAInstallButton({ variant = 'hero' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress when running inside installed standalone app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const btnClasses =
    variant === 'hero'
      ? 'inline-flex items-center gap-2 bg-[#111318] dark:bg-white text-white dark:text-[#111318] hover:bg-[#B51B27] dark:hover:bg-[#B51B27] dark:hover:text-white text-sm font-semibold px-5 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer'
      : 'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] hover:text-[#B51B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={btnClasses}
        title="Download and install Ulterior Engineering CA Portal App"
      >
        <Download className={variant === 'hero' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        <span>Download App</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-[#E2E5EB] dark:border-[#262B35] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#111318] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-[#B51B27]" />
                </div>
                <div>
                  <div className="text-xs font-mono font-semibold text-[#B51B27]">
                    Progressive Web App
                  </div>
                  <h3
                    id="pwa-install-title"
                    className="font-display text-base font-extrabold text-[#111318] dark:text-white"
                  >
                    Install UE CA Portal App
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close app install guide"
                className="text-[#5A6270] hover:text-[#B51B27] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#5A6270] dark:text-slate-300 leading-relaxed">
              {isInstallable ? (
                <div className="space-y-3">
                  <p>
                    Your browser supports direct 1-tap installation. Launch UE CA Portal directly
                    from your Home Screen or Desktop without browser chrome.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await install();
                      setShowGuide(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white font-semibold py-2.5 px-4 rounded-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Directly Now</span>
                  </button>
                </div>
              ) : isIOS ? (
                <div className="space-y-2.5">
                  <p className="font-semibold text-[#111318] dark:text-white">
                    Install on iPhone or iPad (Safari):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>
                      Tap the <strong>Share</strong> icon in Safari&apos;s bottom toolbar.
                    </li>
                    <li>
                      Scroll down and select <strong>Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong>Add</strong> in the top-right corner to launch as an app.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-semibold text-[#111318] dark:text-white">
                    Install on Android, Windows, macOS, or Linux:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
                      <span>
                        <strong>Desktop Chrome / Edge:</strong> Open the app in its own browser
                        tab and click the <strong>Install</strong> icon in the right side of the
                        address bar.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
                      <span>
                        <strong>Android Chrome:</strong> Tap the browser menu (⋮) and choose{' '}
                        <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#B51B27] shrink-0 mt-0.5" />
                      <span>
                        <strong>Offline Ready:</strong> Core portal interface and fonts are cached
                        automatically via Service Worker.
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-lg border border-[#E2E5EB] dark:border-[#262B35] py-2 text-xs font-semibold text-[#111318] dark:text-slate-100 hover:border-[#B51B27] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Showing cached portal data</span>
    </div>
  );
}
