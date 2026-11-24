import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Smartphone } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePageTitle } from '../hooks/usePageTitle';

export default function DownloadPage() {
  usePageTitle('Download App – Ulterior Engineering');

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
