/** Small loading skeleton shown while a lazy-loaded page chunk loads. */
export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true" aria-label="Loading page">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#E2E5EB] dark:bg-[#262B35]" />
          <div className="space-y-2 flex-1">
            <div className="h-7 w-56 max-w-full rounded bg-[#E2E5EB] dark:bg-[#262B35]" />
            <div className="h-4 w-96 max-w-full rounded bg-[#E2E5EB] dark:bg-[#262B35]" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl bg-[#E2E5EB]/70 dark:bg-[#262B35]/70"
            />
          ))}
        </div>
        <div className="h-4 w-2/3 rounded bg-[#E2E5EB] dark:bg-[#262B35]" />
        <div className="h-4 w-1/2 rounded bg-[#E2E5EB] dark:bg-[#262B35]" />
      </div>
    </div>
  );
}
