import { useEffect, useState } from "react";
import { ArrowUpRight, School, Sparkles, Trophy } from "lucide-react";
import { getLeaderboard } from "../api";
import { useUser } from "../context/useUser";
import { getAvatarEmoji } from "../utils/avatarHelper";
import AppLayout from "./AppLayout";

function RankingCard({ competitor }) {
  const isTop3 = competitor.place <= 3;
  return (
    <article
      className={`relative flex items-center gap-3.5 rounded-3xl border-2 p-3.5 shadow-[0_5px_0_#D6E3F8] transition ${
        competitor.current
          ? "border-[#0284C7] bg-[#EFF6FF] py-4 shadow-[0_7px_0_#0284C7]/30 ring-2 ring-[#0284C7]/20"
          : "border-[#E2E8F0] bg-white hover:border-blue-200"
      }`}
    >
      {competitor.current && (
        <span className="absolute -top-3 right-4 rounded-full bg-[#0284C7] px-3 py-0.5 font-heading text-[11px] font-black tracking-wider text-white shadow-sm">
          ¡TÚ!
        </span>
      )}

      {/* Medalla o número de posición */}
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-heading text-lg font-black ${
          isTop3
            ? competitor.place === 1
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : competitor.place === 2
              ? "bg-slate-200 text-slate-700 border border-slate-300"
              : "bg-orange-100 text-orange-800 border border-orange-300"
            : "bg-[#F1F5F9] text-slate-500 font-bold text-sm"
        }`}
      >
        {competitor.medal}
      </span>

      {/* Avatar Emoji Formateado Limpiamente */}
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl shadow-inner ${
          competitor.current
            ? "border-2 border-[#0284C7] bg-white"
            : "border border-slate-200 bg-[#F8FAFC]"
        }`}
      >
        {getAvatarEmoji(competitor.avatar)}
      </span>

      {/* Nombre y Racha */}
      <div className="min-w-0 flex-1">
        <strong className="block truncate font-heading text-sm font-extrabold text-slate-800">
          {competitor.name}
        </strong>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
          <span>Racha: {competitor.streak} días</span>
          <span>🔥</span>
        </span>
      </div>

      {/* Puntos en la clase */}
      <div className="shrink-0 text-right">
        <span
          className={`inline-block rounded-xl px-3 py-1.5 font-heading text-xs font-black shadow-sm ${
            competitor.current
              ? "bg-[#0284C7] text-white"
              : "bg-amber-100 border border-amber-300 text-amber-900"
          }`}
        >
          {competitor.xp} XP
        </span>
      </div>
    </article>
  );
}

export default function MissionsScreen({ onLogout, onNavigate = () => {}, activeClass }) {
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllLeagues, setShowAllLeagues] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let isCurrent = true;
    setLoading(true);

    getLeaderboard(user.id, activeClass?.id)
      .then((res) => {
        if (!isCurrent) return;
        setData(res);
      })
      .catch((err) => console.error("Error al cargar la liga:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, activeClass?.id, user?.points]);

  const league = data?.league || {
    id: "bronce",
    name: "Liga Bronce",
    icon: "🥉",
    description: "¡Bienvenido a la liga inicial de tu clase!",
    promotionText: "🥉 Alcanza 100 XP para ascender a la Liga Plata",
    countdownText: "Temporada activa",
    minPoints: 0,
  };

  const nextLeague = data?.nextLeague;
  const pointsToNext = data?.pointsToNext ?? 0;
  const currentPoints = data?.currentPoints ?? (activeClass?.classPoints ?? 0);
  const competitors = data?.ranking || [];
  const allLeagues = data?.allLeagues || [];

  // Cálculo de progreso porcentual para la barra
  let progressPercent = 100;
  if (nextLeague) {
    const prevPoints = league.minPoints || 0;
    const range = nextLeague.minPoints - prevPoints;
    const currentInLevel = Math.max(0, currentPoints - prevPoints);
    progressPercent = range > 0 ? Math.min(100, Math.round((currentInLevel / range) * 100)) : 0;
  }

  const displayPoints = activeClass ? activeClass.classPoints : user?.points;

  return (
    <AppLayout
      activeItem="liga"
      onLogout={onLogout}
      onNavigate={onNavigate}
      displayPoints={displayPoints}
    >
      {/* Cabecera */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <p className="font-heading text-xs font-black uppercase tracking-[0.14em] text-[#0284C7]">
              Liga Escolar
            </p>
          </div>
          <h1 className="mt-1 font-heading text-[2rem] font-extrabold leading-tight text-slate-900">
            {activeClass ? activeClass.name : "Tu Liga"}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3.5 py-1.5 text-center shadow-sm">
          <span className="text-xl">{league.icon || "🏆"}</span>
          <span className="font-heading text-xs font-black text-amber-900">{league.name}</span>
        </div>
      </header>

      {/* Tarjeta de la Liga Actual y Progreso hacia la Siguiente Liga */}
      <section className="mt-5 rounded-3xl border-2 border-[#D5E5FF] bg-gradient-to-br from-white to-[#F0F7FF] p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 border border-amber-300 text-3xl shadow-sm">
              {league.icon || "🏆"}
            </span>
            <div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-heading text-[10px] font-extrabold text-[#0284C7] uppercase">
                Rango Actual en Clase
              </span>
              <h2 className="font-heading text-xl font-extrabold text-slate-800">
                {league.name}
              </h2>
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 block">Tus Puntos</span>
            <span className="font-heading text-base font-black text-[#0284C7]">
              ⭐ {currentPoints} XP
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-600 leading-relaxed">
          {league.description}
        </p>

        {/* Barra de progreso hacia la siguiente liga */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600">
              {nextLeague ? `Rumbo a ${nextLeague.icon} ${nextLeague.name}` : "¡Rango Máximo Alcanzado!"}
            </span>
            <span className="font-black text-[#0284C7]">
              {nextLeague ? `${currentPoints} / ${nextLeague.minPoints} XP` : "👑 Cima Cósmica"}
            </span>
          </div>
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {nextLeague && (
            <p className="mt-2 text-[11px] font-extrabold text-amber-800 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>¡Solo te faltan <strong>{pointsToNext} XP</strong> para ascender!</span>
            </p>
          )}
        </div>

        {/* Botón para ver la escalera de las 8 ligas */}
        <button
          type="button"
          onClick={() => setShowAllLeagues(!showAllLeagues)}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 font-heading text-xs font-extrabold text-[#0284C7] hover:underline"
        >
          <span>{showAllLeagues ? "Ocultar tabla de ligas" : "Ver todas las 8 ligas y requisitos"}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </section>

      {/* Desglose de las 8 Ligas */}
      {showAllLeagues && (
        <section className="mt-4 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm animate-in fade-in duration-200">
          <h3 className="font-heading text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2.5">
            Escalera de las 8 Ligas Escolares
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {allLeagues.map((l) => {
              const isCurrent = l.id === league.id;
              return (
                <div
                  key={l.id}
                  className={`rounded-2xl border p-2.5 text-left transition ${
                    isCurrent
                      ? "border-[#0284C7] bg-[#EFF6FF] shadow-sm ring-2 ring-[#0284C7]/20"
                      : "border-slate-100 bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{l.icon}</span>
                    <strong className="font-heading text-xs font-bold text-slate-800 truncate">
                      {l.name}
                    </strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-700">{l.minPoints} XP</span>
                    {isCurrent && (
                      <span className="font-black text-[#0284C7] text-[10px]">TÚ AQUÍ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Ranking de Alumnos de esta Clase */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <School className="h-4 w-4 text-slate-500" />
            <h2 className="font-heading text-sm font-extrabold uppercase tracking-wider text-slate-700">
              Ranking de tu Clase ({competitors.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {activeClass ? activeClass.name : "Compañeros"}
          </span>
        </div>

        {loading ? (
          <div className="mt-10 text-center font-heading text-slate-500">
            <div className="mx-auto mb-3 grid h-12 w-12 animate-spin place-items-center rounded-full border-4 border-[#0284C7] border-t-transparent text-lg">
              🏆
            </div>
            Cargando ranking de tu clase...
          </div>
        ) : !activeClass ? (
          <div className="rounded-3xl border-2 border-dashed border-[#D5E5FF] bg-white p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-3xl">
              🏫
            </div>
            <h3 className="mt-3 font-heading text-base font-extrabold text-slate-800">
              Aún no estás en una clase
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Únete a una clase con el código de tu profesor desde la pantalla de Inicio para competir con tus compañeros en la Liga.
            </p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#D5E5FF] bg-white p-6 text-center">
            <p className="text-xs font-semibold text-slate-500">
              Aún no hay alumnos con puntos en esta clase. ¡Sé el primero en resolver una lección y liderar la liga!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {competitors.map((competitor) => (
              <RankingCard key={competitor.id || competitor.place} competitor={competitor} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
