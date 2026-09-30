import { ArrowLeft } from "lucide-react";
import { useUser } from "../../context/useUser";
import { getAvatarEmoji } from "../../utils/avatarHelper";

export default function TopBar({ onBack, title, onStreak, rightContent, displayPoints, onProfile, maxWidth = "max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl" }) {
  const { user, pointsPulse } = useUser();
  const hasBack = Boolean(onBack);
  const pointsToShow = displayPoints !== undefined && displayPoints !== null ? displayPoints : (user?.points ?? 0);

  return (
    <header className="sticky top-0 z-20 bg-[#F8FAFC]/95 px-3 sm:px-5 pb-2.5 sm:pb-3 pt-3 sm:pt-4 backdrop-blur-sm safe-area-top">
      <div className={`mx-auto flex ${maxWidth} items-center gap-2 sm:gap-3`}>
        {hasBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full border-2 border-[#E1E7EE] bg-white text-[#08739F] shadow-[0_4px_0_#C9D4DF] active:translate-y-0.5"
          >
            <ArrowLeft />
          </button>
        ) : (
          <button
            type="button"
            onClick={onProfile}
            title="Personalizar mi perfil"
            className="group relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-xl shadow-soft transition hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-transparent hover:ring-[#0284C7]/30"
          >
            {getAvatarEmoji(user?.avatar)}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#34D399]" />
            {user?.hasSubscription && (
              <span className="absolute -top-1 -right-1 text-[11px] leading-none">👑</span>
            )}
          </button>
        )}

        <div className="min-w-0 flex-1">
          {title ? (
            <p className="truncate font-heading text-base font-extrabold text-[#0369A1]">{title}</p>
          ) : (
            <button
              type="button"
              onClick={onProfile}
              className="text-left group cursor-pointer block truncate w-full"
              title="Personalizar mi perfil"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">QuestWorld</p>
              <p className="truncate font-heading text-base font-bold text-slate-800 group-hover:text-[#0284C7] transition">
                ¡Hola, {user?.name || "Explorador"}! ✨
              </p>
            </button>
          )}
        </div>

        {rightContent ? (
          <div className={`relative flex shrink-0 items-center gap-2 ${pointsPulse ? "animate-pulse ring-4 ring-[#FDE68A]" : ""}`}>
            {rightContent}
            {pointsPulse && <span className="absolute -top-7 right-0 whitespace-nowrap text-sm text-[#B45309]">{pointsPulse}</span>}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {!hasBack && onStreak && (
              <button
                type="button"
                onClick={onStreak}
                className="flex items-center gap-1 rounded-full border border-amber-200 bg-[#FEF3C7] px-2.5 py-1.5 font-heading text-xs font-extrabold text-[#92400E] shadow-sm transition hover:scale-105 active:scale-95"
                title="Ver tu racha"
              >
                <span>🔥</span>
                <span>{user?.streakDays ?? 0} {Number(user?.streakDays) === 1 ? "día" : "días"}</span>
              </button>
            )}
            <div
              className={`relative flex items-center gap-1 rounded-full border border-sky-200 bg-[#E0F2FE] px-3 py-1.5 font-heading text-sm font-extrabold text-[#0369A1] shadow-sm ${
                pointsPulse ? "animate-pulse ring-4 ring-[#FDE68A]" : ""
              }`}
            >
              <span>⭐ {pointsToShow}</span>
              {pointsPulse && (
                <span className="absolute -top-7 right-0 whitespace-nowrap text-sm font-extrabold text-[#B45309]">
                  {pointsPulse}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
