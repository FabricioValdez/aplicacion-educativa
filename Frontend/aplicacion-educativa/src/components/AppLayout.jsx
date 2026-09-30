import BottomNav from "./BottomNav";
import TopBar from "./common/TopBar";

export default function AppLayout({
  children,
  onLogout,
  activeItem = "inicio",
  onNavigate,
  showHeader = true,
  onStreak,
  displayPoints,
  onProfile,
  maxWidth = "max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl",
}) {
  const handleProfileClick = onProfile || (() => onNavigate && onNavigate("profile"));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8FAFC] text-slate-800">
      {showHeader && (
        <TopBar
          onStreak={onStreak}
          displayPoints={displayPoints}
          onProfile={handleProfileClick}
          maxWidth={maxWidth}
        />
      )}
      <main className={`mx-auto w-full flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pb-32 sm:pb-36 pt-4 sm:pt-6 scroll-smooth ${maxWidth}`}>
        {children}
      </main>
      <BottomNav onLogout={onLogout} activeItem={activeItem} onNavigate={onNavigate} />
    </div>
  );
}
