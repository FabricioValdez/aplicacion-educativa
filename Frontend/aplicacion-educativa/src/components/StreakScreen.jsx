import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useUser } from "../context/useUser";

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function CalendarCard({ activeDays = [], streakDays = 0 }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const todayKey = dateKey(today);
  const displayedDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (displayedDate.getDay() + 6) % 7;
  const days = Array.from(
    { length: startOffset + daysInMonth },
    (_, index) => (index < startOffset ? null : index - startOffset + 1)
  );
  const monthActiveDays = activeDays.filter((value) =>
    value.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)
  );

  return (
    <section className="rounded-[2rem] border-2 border-[#D5E5FF] bg-white p-5 shadow-[0_8px_0_#D6E3F8]">
      <div className="flex items-center justify-between border-b-2 border-[#EFF4FB] pb-3">
        <button
          type="button"
          onClick={() => setMonthOffset((value) => value - 1)}
          aria-label="Mes anterior"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#E0F2FE] text-xl font-black text-[#0369A1] shadow-[0_3px_0_#CBD5E1] active:translate-y-0.5"
        >
          ‹
        </button>
        <h2 className="font-heading text-lg font-extrabold text-[#0369A1]">
          📅 {monthNames[month]} {year}
        </h2>
        <button
          type="button"
          onClick={() => setMonthOffset((value) => Math.min(0, value + 1))}
          disabled={monthOffset === 0}
          aria-label="Mes siguiente"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#E0F2FE] text-xl font-black text-[#0369A1] shadow-[0_3px_0_#CBD5E1] disabled:opacity-40 active:translate-y-0.5"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-500">
        {weekDays.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} className="aspect-square" />;
          const key = dateKey(new Date(year, month, day));
          const isActive = activeDays.includes(key);
          const isToday = key === todayKey;

          return (
            <span
              key={key}
              className={`relative flex aspect-square items-center justify-center rounded-full border-2 text-sm font-extrabold transition-all duration-200 ${
                isToday && isActive
                  ? "border-[#0284C7] bg-gradient-to-br from-[#FDE68A] to-[#FBBF24] text-[#78350F] shadow-[0_3px_0_#0284C7]"
                  : isToday && !isActive
                  ? "border-[#0284C7] bg-[#E0F2FE] text-[#0369A1] shadow-[0_3px_0_#0284C7]"
                  : isActive
                  ? "border-transparent bg-gradient-to-br from-[#FDE68A] to-[#FBBF24] text-[#78350F]"
                  : "border-transparent bg-[#F1F5F9] text-slate-400"
              }`}
            >
              {day}
              {isToday && (
                <small className="absolute -bottom-1 rounded-full bg-[#0284C7] px-1 text-[7px] font-black text-white">
                  HOY
                </small>
              )}
              {isActive && (
                <small className="absolute -top-1 right-0 text-[10px] filter drop-shadow">🔥</small>
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-5 border-t-2 border-[#EFF4FB] pt-4 flex items-center justify-between text-xs font-extrabold text-slate-600">
        <span>¡{monthActiveDays.length} días de aprendizaje este mes! 🌟</span>
        <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-black text-amber-800">
          🔥 Racha: {streakDays}
        </span>
      </div>
    </section>
  );
}

export default function StreakScreen({ onBack }) {
  const { user } = useUser();
  const streakDays = user?.streakDays ?? 0;
  const streakShields = user?.streakShields ?? 2;
  const todayKey = dateKey(new Date());
  const isCompletedToday = (user?.activeDays || []).includes(todayKey);

  return (
    <main className="min-h-[100dvh] bg-[#F8FAFC] px-4 sm:px-6 py-5 sm:py-7 pb-20 text-slate-800">
      <div className="mx-auto max-w-md sm:max-w-lg md:max-w-xl">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver al inicio"
            className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#E1E7EE] bg-white text-[#08739F] shadow-[0_4px_0_#C9D4DF] active:translate-y-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-xl font-extrabold text-[#0369A1]">
            Tu Racha de Explorador ✨
          </h1>
        </header>

        {/* Banner Superior de Racha - Rediseñado, Moderno y Proporcionado */}
        <section className="relative mt-5 overflow-hidden rounded-[2.2rem] border-2 border-amber-300 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 p-5 text-center text-white shadow-[0_8px_0_#D97706]">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-yellow-200/20 blur-xl" />

          {/* Icono de Llama estilizado y compacto */}
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 shadow-inner">
            <span className="text-3xl filter drop-shadow-md select-none animate-pulse">🔥</span>
          </div>

          {/* Contador de Racha */}
          <div className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 font-heading text-lg font-black text-amber-900 shadow-md">
            <span>🔥</span>
            <span>{streakDays} {streakDays === 1 ? "DÍA SEGUIDO" : "DÍAS SEGUIDOS"}</span>
            <span>✨</span>
          </div>

          <p className="mt-2.5 font-heading text-xs font-bold text-amber-100/95 leading-relaxed">
            {streakDays === 0
              ? "¡Completa una lección hoy para encender tu fuego explorador! 🚀"
              : isCompletedToday
              ? "¡Fuego encendido hoy! Has completado tu lección y tu racha está a salvo."
              : "¡Tu racha te espera! Completa al menos una lección hoy para mantenerla viva."}
          </p>

          <div className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-amber-950/20 backdrop-blur-sm border border-white/20 px-3 py-1.5 text-xs font-black text-white">
            {isCompletedToday ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>✅ Lección de hoy completada</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-yellow-300" />
                <span>⏳ Pendiente: completa una lección hoy para activar la racha</span>
              </>
            )}
          </div>
        </section>

        {/* Sección Protector de Racha (Escudos Mágicos) */}
        <section className="mt-4 rounded-[2rem] border-2 border-sky-200 bg-white p-4 shadow-[0_6px_0_#BAE6FD]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-xl border border-sky-200 shadow-sm">
                🛡️
              </div>
              <div>
                <h2 className="font-heading text-sm font-black text-slate-800">
                  Protector de Racha
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Escudos Mágicos Galácticos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 font-heading text-xs font-black text-sky-700 shadow-inner">
              <span>🛡️ {streakShields} Disponibles</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sky-50/70 border border-sky-100 p-3">
            <div className="flex shrink-0 gap-1.5">
              {Array.from({ length: Math.max(2, streakShields) }).map((_, i) => (
                <div
                  key={i}
                  className={`grid h-8 w-8 place-items-center rounded-xl border text-sm transition-all ${
                    i < streakShields
                      ? "border-sky-300 bg-white shadow-sm text-sky-600"
                      : "border-slate-200 bg-slate-100 opacity-40 grayscale"
                  }`}
                >
                  🛡️
                </div>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-slate-600 leading-snug">
              Si un día no puedes practicar, tu escudo se activará automáticamente para que no pierdas tus días acumulados.
            </p>
          </div>
        </section>

        {/* Calendario de Racha */}
        <div className="mt-4">
          <CalendarCard activeDays={user?.activeDays || []} streakDays={streakDays} />
        </div>
      </div>
    </main>
  );
}
