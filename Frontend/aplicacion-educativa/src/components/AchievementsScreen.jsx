import { useEffect, useState } from "react";
import { getUserAchievements } from "../api";
import { useUser } from "../context/useUser";
import AppLayout from "./AppLayout";

export default function AchievementsScreen({ onLogout, onNavigate = () => {} }) {
  const { user } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let isCurrent = true;
    setLoading(true);
    getUserAchievements(user.id)
      .then((data) => {
        if (!isCurrent) return;
        setAchievements(data.achievements || []);
      })
      .catch((err) => console.error("Error al cargar logros:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <AppLayout activeItem="logros" onLogout={onLogout} onNavigate={onNavigate} user={user}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-extrabold uppercase tracking-[0.12em] text-[#0284C7]">
            QuestWorld
          </p>
          <h1 className="mt-1 font-heading text-[2rem] font-extrabold leading-tight text-slate-900">
            Logros & Insignias
          </h1>
        </div>
        <span className="rounded-full border-2 border-[#FEF08A] bg-[#FEF9C3] px-4 py-2 font-heading text-sm font-extrabold text-[#854D0E] shadow-sm">
          ⭐ {unlockedCount}/{achievements.length}
        </span>
      </header>

      <section className="mt-6 rounded-3xl border-2 border-[#D5E5FF] bg-gradient-to-br from-[#EFF6FF] to-white p-5 shadow-[0_6px_0_#D6E3F8]">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-extrabold text-slate-800">Tu Progreso de Coleccionista</h2>
          <span className="font-heading text-base font-extrabold text-[#0284C7]">{progressPercent}%</span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          ¡Aprende y supera retos para desbloquear todas las insignias galácticas!
        </p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#E2E8F0]">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#0284C7] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {loading ? (
        <div className="mt-10 text-center font-heading text-slate-500">
          <div className="mx-auto mb-3 grid h-14 w-14 animate-spin place-items-center rounded-full border-4 border-[#0284C7] border-t-transparent text-xl">
            ⭐
          </div>
          Cargando tus logros...
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {achievements.map((ach) => (
            <article
              key={ach.id}
              className={`relative flex items-center gap-4 rounded-3xl border-2 p-4 transition ${
                ach.unlocked
                  ? "border-[#FDE047] bg-white shadow-[0_6px_0_#FACC15]"
                  : "border-[#E2E8F0] bg-slate-50 opacity-70 shadow-none"
              }`}
            >
              <div
                className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl shadow-sm ${
                  ach.unlocked ? "bg-[#FEF9C3]" : "bg-slate-200 grayscale"
                }`}
              >
                {ach.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-extrabold text-slate-800">{ach.title}</h3>
                  {ach.unlocked && (
                    <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-extrabold text-[#047857]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">{ach.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[11px] font-bold text-[#0369A1]">
                    +{ach.pointsReward} ⭐
                  </span>
                  {!ach.unlocked && (
                    <span className="text-[11px] font-bold text-slate-400">🔒 Bloqueado</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppLayout>
  );
}
