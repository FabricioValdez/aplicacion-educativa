export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function Lives({ lives = 3, shaking = false, infinite = false }) {
  if (infinite) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-100 px-3 py-1 shadow-sm"
        aria-label="Vidas infinitas activas"
      >
        <span className="text-sm">👑</span>
        <span className="font-heading text-xs font-black text-amber-900 tracking-wide">Vidas ∞</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 rounded-full border-2 border-[#FECACA] bg-white px-2 py-1 transition-transform ${
        shaking ? "animate-pulse scale-110" : ""
      }`}
      aria-label={`${lives} de 3 vidas restantes`}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`text-xl leading-none transition-all duration-300 ${
            index < lives ? "text-[#EF4444]" : "text-[#CBD5E1] grayscale"
          }`}
          aria-hidden="true"
        >
          ♥
        </span>
      ))}
    </div>
  );
}

export function GameOverModal({ onRefill, onExit, isPaying = false, error = "" }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <section className="w-full max-w-md rounded-3xl border-2 border-[#FECACA] bg-white p-5 sm:p-6 text-center shadow-[0_12px_0_rgba(15,23,42,0.16)] max-h-[85vh] overflow-y-auto">
        <div className="mx-auto grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-full bg-[#FEF2F2] text-4xl sm:text-5xl">💔</div>
        <h2 id="game-over-title" className="mt-3 sm:mt-4 font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
          ¡Oh no! Te has quedado sin vidas 💔
        </h2>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-semibold leading-relaxed text-slate-600">
          Pide ayuda a un adulto para recargar tus vidas y continuar tu aventura justo donde te quedaste.
        </p>
        <div className="mt-4 sm:mt-5 rounded-2xl sm:rounded-3xl border-2 border-[#FBBF24] bg-[#FFFBEB] p-3.5 sm:p-4 text-left shadow-[0_5px_0_#FBBF24]">
          <p className="font-heading text-sm sm:text-base font-extrabold text-[#78350F]">Paquete Recarga Completa (3 Vidas ❤️❤️❤️)</p>
          <p className="mt-0.5 sm:mt-1 font-heading text-xl sm:text-2xl font-extrabold text-[#B45309]">$1.99 USD</p>
          <button
            type="button"
            onClick={onRefill}
            disabled={isPaying}
            className="mt-3 sm:mt-4 flex min-h-12 sm:min-h-14 w-full items-center justify-center rounded-full bg-[#0284C7] px-4 font-heading text-sm sm:text-base font-extrabold text-white shadow-button transition active:scale-95 disabled:opacity-60 touch-manipulation"
          >
            {isPaying ? "Abriendo Stripe..." : "Recargar Vidas con Stripe 💳"}
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-xs sm:text-sm font-bold text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onExit}
          className="mt-3 sm:mt-4 min-h-10 sm:min-h-11 w-full rounded-full bg-[#E2E8F0] px-4 font-heading text-sm font-extrabold text-slate-700 transition hover:bg-[#CBD5E1] touch-manipulation"
        >
          Salir de la lección
        </button>
      </section>
    </div>
  );
}

export function SummaryScreen({
  elapsedSeconds = 0,
  correctCount = 0,
  score = 0,
  onBack = () => {},
  totalQuestions = 10,
  subjectTitle = "¡Misión Cumplida, Explorador!",
  badgeEmoji = "🏆",
}) {
  const safeTotal = Math.max(1, totalQuestions);
  const accuracy = Math.round((correctCount / safeTotal) * 100);

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FF] px-4 py-6 sm:py-8 text-slate-800">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md sm:max-w-lg flex-col justify-center">
        <section className="rounded-[2rem] border-2 border-[#D5E5FF] bg-white p-5 sm:p-7 text-center shadow-[0_8px_0_#D6E3F8]">
          <div className="mx-auto grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-full bg-[#FEF3C7] text-4xl sm:text-5xl shadow-[0_5px_0_#FBBF24]">
            {badgeEmoji}
          </div>
          <h1 className="mt-5 sm:mt-6 font-heading text-2xl sm:text-[2rem] font-extrabold leading-tight">
            {subjectTitle}
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-bold text-slate-500">
            Has completado los {totalQuestions} retos con éxito.
          </p>

          <div className="mt-6 sm:mt-7 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-[#EFF6FF] p-2.5 sm:p-3 border border-[#BFDBFE]">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500">Tiempo</p>
              <p className="font-heading text-base sm:text-lg font-extrabold text-[#0369A1]">{formatTime(elapsedSeconds)}</p>
            </div>
            <div className="rounded-2xl bg-[#ECFDF5] p-2.5 sm:p-3 border border-[#A7F3D0]">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500">Aciertos</p>
              <p className="font-heading text-base sm:text-lg font-extrabold text-[#047857]">{accuracy}%</p>
            </div>
            <div className="rounded-2xl bg-[#FFFBEB] p-2.5 sm:p-3 border border-[#FDE68A]">
              <p className="text-[11px] sm:text-xs font-bold text-slate-500">Puntos</p>
              <p className="font-heading text-base sm:text-lg font-extrabold text-[#B45309]">+{score} ⭐</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 sm:mt-7 flex min-h-12 sm:min-h-14 w-full items-center justify-center rounded-full bg-[#0284C7] px-5 font-heading text-base sm:text-lg font-extrabold text-white shadow-button transition active:scale-95 touch-manipulation"
          >
            Volver al Inicio ➔
          </button>
        </section>
      </div>
    </div>
  );
}
