import { ArrowRight, Crown, LogIn, Terminal, UserRound } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PrevNext } from '../components/PrevNext';
import { ROLE_LABELS } from '../services/portalService';
import { usePageTitle } from '../hooks/usePageTitle';
import { AuthSignInMode, PortalUser } from '../types';

interface SignInPageProps {
  currentUser: PortalUser | null;
  authLoading: boolean;
  onOpenAuthOrDashboard: (mode: AuthSignInMode) => void;
}

const SIGN_IN_OPTIONS: {
  mode: AuthSignInMode;
  icon: typeof UserRound;
  title: string;
  description: string;
}[] = [
  {
    mode: 'standard',
    icon: UserRound,
    title: 'Personal Sign In',
    description: 'For Campus Ambassadors, Core Team Leads and the Program Secretary.',
  },
  {
    mode: 'executive',
    icon: Crown,
    title: 'Chair & CEO Sign In',
    description: 'Executive sign-in for the Program Chair and Company CEO.',
  },
  {
    mode: 'developer',
    icon: Terminal,
    title: 'Developer Sign In',
    description: 'For authorized Platform Developers only.',
  },
];

export default function SignInPage({
  currentUser,
  authLoading,
  onOpenAuthOrDashboard,
}: SignInPageProps) {
  usePageTitle('Portal Sign In – Ulterior Engineering');

  return (
    <>
      <PageHeader
        icon={LogIn}
        title="Portal Sign In"
        description="Sign in with Google to open your role-locked portal dashboard."
      />
      <section className="py-14 lg:py-16 border-b border-[#E2E5EB] dark:border-[#262B35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentUser ? (
            <div className="bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#B51B27] text-white flex items-center justify-center font-display font-extrabold text-lg shrink-0">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold text-[#111318] dark:text-white truncate">
                    {currentUser.displayName}
                  </h2>
                  <p className="text-xs text-[#5A6270] dark:text-slate-400 mt-0.5">
                    {currentUser.role
                      ? ROLE_LABELS[currentUser.role]
                      : 'Signed in — no role assigned yet'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuthOrDashboard('standard')}
                className="mt-6 inline-flex items-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white text-sm font-semibold px-5 py-3 min-h-[44px] rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
              >
                <span>Open My Dashboard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SIGN_IN_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  disabled={authLoading}
                  onClick={() => onOpenAuthOrDashboard(option.mode)}
                  className="group text-left bg-white dark:bg-[#15181E] border border-[#E2E5EB] dark:border-[#262B35] rounded-xl p-6 hover:border-[#B51B27] transition-colors duration-150 disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
                >
                  <span className="w-11 h-11 rounded-lg bg-[#B51B27]/10 text-[#B51B27] flex items-center justify-center">
                    <option.icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <span className="flex items-center gap-1.5 font-display font-bold text-base text-[#111318] dark:text-white mt-4">
                    {option.title}
                    <ArrowRight
                      className="w-4 h-4 text-[#B51B27] group-hover:translate-x-0.5 transition-transform duration-150"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="block text-xs text-[#5A6270] dark:text-slate-400 mt-1.5 leading-relaxed">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <PrevNext current="/signin" />
    </>
  );
}
