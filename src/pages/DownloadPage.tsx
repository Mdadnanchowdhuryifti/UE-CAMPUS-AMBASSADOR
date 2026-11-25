import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Apple, ArrowLeft, Bot, Check, Download, Monitor, Share, Smartphone } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePageTitle } from '../hooks/usePageTitle';

const APK_DOWNLOAD_URL =
  'https://drive.google.com/uc?id=1VRbqgFo9exhC6blVCOC8zok-CyISsAbF&export=download';

type Platform = 'android' | 'ios' | 'pc';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'pc';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'pc';
}

const cardBase =
  'relative bg-white dark:bg-[#15181E] border rounded-xl p-6 flex flex-col gap-4';
const cardNormal = 'border-[#E2E5EB] dark:border-[#262B35]';
const cardActive = 'border-[#B51B27] ring-1 ring-[#B51B27]';

function YourDeviceBadge() {
  return (
    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[#B51B27] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      <Check className="w-3 h-3" aria-hidden="true" />
      Your device
    </span>
  );
}

export default function DownloadPage() {
  usePageTitle('Download App – Ulterior Engineering');
  const [platform, setPlatform] = useState<Platform>('pc');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <>
      <PageHeader
        icon={Download}
        title="Download App"
        description="Install the portal as an app on your phone or desktop."
      />
      <section className="py-14 lg:py-16 border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="w-14 h-14 rounded-lg bg-[#111318] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6 text-[#B51B27]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold text-[#111318] dark:text-white">
                Ulterior Engineering — CA Portal App
              </h2>
              <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-2 leading-relaxed max-w-2xl">
                Install the Campus Ambassador Program Portal on your device for quick access to
                your role-locked dashboard, the live KPI leaderboard, workshops and credential
                verification — no app store needed.
              </p>
              <div className="mt-5">
                <PWAInstallButton variant="hero" />
              </div>
            </div>
          </div>

          <h3 className="font-display text-lg font-extrabold text-[#111318] dark:text-white mt-10">
            Get the app for your device
          </h3>
          <div className="grid gap-6 md:grid-cols-3 mt-5">
            <div className={`${cardBase} ${platform === 'android' ? cardActive : cardNormal}`}>
              {platform === 'android' && <YourDeviceBadge />}
              <div className="w-12 h-12 rounded-lg bg-[#111318] text-white flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#B51B27]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-[#111318] dark:text-white">
                  Android
                </h4>
                <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                  Download the official APK and install it directly — no Play Store needed.
                </p>
              </div>
              <ol className="text-sm text-[#5A6270] dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>Tap Download APK below</li>
                <li>Open the downloaded file</li>
                <li>Allow install when asked, then tap Install</li>
              </ol>
              <a
                href={APK_DOWNLOAD_URL}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#B51B27] px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white hover:bg-[#9E1722] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download APK
              </a>
            </div>

            <div className={`${cardBase} ${platform === 'ios' ? cardActive : cardNormal}`}>
              {platform === 'ios' && <YourDeviceBadge />}
              <div className="w-12 h-12 rounded-lg bg-[#111318] text-white flex items-center justify-center">
                <Apple className="w-6 h-6 text-[#B51B27]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-[#111318] dark:text-white">
                  iPhone &amp; iPad (iOS)
                </h4>
                <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                  Apple does not allow direct app installs, so add the portal to your Home
                  Screen from Safari — it works exactly like an app.
                </p>
              </div>
              <ol className="text-sm text-[#5A6270] dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>Open this site in Safari</li>
                <li>
                  Tap the <Share className="inline w-4 h-4 -mt-0.5" aria-hidden="true" /> Share
                  button
                </li>
                <li>Tap &ldquo;Add to Home Screen&rdquo;, then &ldquo;Add&rdquo;</li>
              </ol>
              <p className="mt-auto text-xs font-semibold text-[#5A6270] dark:text-slate-400 border border-dashed border-[#E2E5EB] dark:border-[#262B35] rounded-lg px-3 py-2.5">
                Tip: this only works in Safari, not Chrome on iOS.
              </p>
            </div>

            <div className={`${cardBase} ${platform === 'pc' ? cardActive : cardNormal}`}>
              {platform === 'pc' && <YourDeviceBadge />}
              <div className="w-12 h-12 rounded-lg bg-[#111318] text-white flex items-center justify-center">
                <Monitor className="w-6 h-6 text-[#B51B27]" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-[#111318] dark:text-white">
                  PC (Windows &amp; Mac)
                </h4>
                <p className="text-sm text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                  Install the portal as a desktop app from Chrome or Edge — it opens in its
                  own window, just like native software.
                </p>
              </div>
              <ol className="text-sm text-[#5A6270] dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>Click Install App below (or the install icon in the address bar)</li>
                <li>Confirm Install</li>
                <li>Launch it from your desktop or Start menu</li>
              </ol>
              <div className="mt-auto">
                <PWAInstallButton />
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 min-h-[44px] rounded-lg border border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E] text-[#111318] dark:text-slate-100 hover:border-[#B51B27] hover:text-[#B51B27] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </section>
      <PrevNext current="/download" />
    </>
  );
}
