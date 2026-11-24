import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page Not Found – Ulterior Engineering');

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-xl bg-[#B51B27]/10 text-[#B51B27] flex items-center justify-center">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="font-mono font-bold text-[#B51B27] mt-6">404</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111318] dark:text-white mt-2">
          Page not found
        </h1>
        <p className="text-sm sm:text-base text-[#5A6270] dark:text-slate-400 mt-3 max-w-md mx-auto">
          The page you are looking for doesn&apos;t exist or may have moved to its own page in the
          new layout.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 bg-[#B51B27] hover:bg-[#92141E] text-white text-sm font-semibold px-5 py-3 min-h-[44px] rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#B51B27] focus-visible:outline-offset-2"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Back to Home
        </Link>
      </div>
    </section>
  );
}
