import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Standard header for every public page: large icon, page title, one-line description. */
export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="ue-watermark border-b border-[#E2E5EB] dark:border-[#262B35] bg-white dark:bg-[#15181E]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#B51B27]/10 text-[#B51B27] flex items-center justify-center shrink-0">
            <Icon className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111318] dark:text-white">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-[#5A6270] dark:text-slate-400 mt-1.5">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
