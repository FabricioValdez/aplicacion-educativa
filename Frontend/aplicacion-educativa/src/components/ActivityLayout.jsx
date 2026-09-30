import TopBar from "./common/TopBar";

export default function ActivityLayout({
  children,
  onBack,
  title,
  icon = "✨",
  counter = null,
  progressLabel,
  progressPercent,
  actionFooter,
}) {
  return (
    <div className="min-h-[100dvh] bg-[#F6F8FF] px-3 sm:px-6 py-3 sm:py-5 text-slate-800 flex flex-col">
      <div className="mx-auto flex w-full min-h-[100dvh] max-w-md sm:max-w-xl md:max-w-2xl flex-col">
        <header className="shrink-0">
          <TopBar
            onBack={onBack}
            title={`${icon} ${title}`}
            rightContent={counter}
            maxWidth="max-w-md sm:max-w-xl md:max-w-2xl"
          />
          {progressLabel && (
            <div className="mt-3 sm:mt-4 rounded-full bg-white p-2 shadow-sm">
              <div className="mb-1 flex items-center justify-between px-1 text-xs font-extrabold text-slate-500">
                <span>{progressLabel}</span>
                <span className="text-[#008B67]">{progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div className="h-full rounded-full bg-[#34D399]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto pb-4 pt-4 sm:pt-5 scroll-smooth">{children}</main>
        {actionFooter && (
          <footer className="sticky bottom-0 z-20 shrink-0 bg-[#F6F8FF]/95 pt-2 sm:pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            {actionFooter}
          </footer>
        )}
      </div>
    </div>
  );
}
