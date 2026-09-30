import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Lock,
  Play,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { getSubjectLessons } from "../api";
import { useUser } from "../context/useUser";
import { isLessonItemCompleted } from "../utils/lessonHelper";
import AppLayout from "./AppLayout";

const subjectDetails = {
  math: {
    name: "Matemáticas",
    title: "Reto Espacial",
    icon: "🚀",
    color: "#0284C7",
    bg: "bg-[#E0F2FE]",
    border: "border-sky-300",
    badge: "bg-sky-100 text-sky-800",
  },
  spanish: {
    name: "Español",
    title: "Palabras Mágicas",
    icon: "📖",
    color: "#D97706",
    bg: "bg-[#FEF3C7]",
    border: "border-amber-300",
    badge: "bg-amber-100 text-amber-800",
  },
  science: {
    name: "Ciencias Naturales",
    title: "Ciclos y Procesos",
    icon: "🌿",
    color: "#059669",
    bg: "bg-[#DCFCE7]",
    border: "border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
  },
  geography: {
    name: "Geografía",
    title: "Mundo Explorador",
    icon: "🌍",
    color: "#0284C7",
    bg: "bg-[#E0F2FE]",
    border: "border-sky-300",
    badge: "bg-blue-100 text-blue-800",
  },
};

export default function SubjectLessonsScreen({
  subject = "math",
  activeClass = null,
  onBack = () => {},
  onSelectLesson = () => {},
  onLogout = () => {},
  onNavigate = () => {},
  onStreak = () => {},
}) {
  const { user } = useUser();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const meta = subjectDetails[subject] || subjectDetails.math;
  const completedLessons = user?.completedLessons || [];

  const loadLessons = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError("");
      const data = await getSubjectLessons(user.id, subject, activeClass?.id || "");
      setLessons(data.lessons || []);
    } catch (err) {
      console.error("Error al cargar lecciones:", err);
      setError("No pudimos cargar las lecciones. Usando lección por defecto.");
      // Fallback a la lección de práctica
      setLessons([
        {
          id: `${subject}_practice`,
          title: "Lección de Práctica / Ejemplo",
          description: "Retos oficiales interactivos para dominar los conceptos clave.",
          subject,
          isDefault: true,
          activityCount: 10,
          completed: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [user?.id, subject, activeClass?.id]);

  const completedCount = lessons.filter((l) => isLessonItemCompleted(l, completedLessons)).length;
  const totalCount = lessons.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isSubjectComplete = totalCount > 0 && completedCount >= totalCount;

  return (
    <AppLayout
      activeItem="inicio"
      onLogout={onLogout}
      onNavigate={onNavigate}
      onStreak={onStreak}
      displayPoints={activeClass ? activeClass.classPoints : user?.points}
    >
      {/* Botón Volver a Inicio */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-heading text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span>Volver a Materias</span>
        </button>
      </div>

      {/* Cabecera de la Materia */}
      <header className="rounded-3xl border-2 border-[#D5E5FF] bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl ${meta.bg} text-3xl shadow-sm`}
            >
              {meta.icon}
            </span>
            <div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 font-heading text-[10px] font-black uppercase tracking-wider ${meta.badge}`}>
                {meta.name}
              </span>
              <h1 className="mt-0.5 font-heading text-xl font-extrabold text-slate-900">
                {meta.title}
              </h1>
            </div>
          </div>
          {isSubjectComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 font-heading text-xs font-black text-emerald-800 shadow-sm">
              <CheckCircle className="h-4 w-4 text-emerald-600 stroke-[3]" />
              <span>¡Materia Lista!</span>
            </span>
          )}
        </div>

        {/* Barra de progreso de la materia */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Progreso de lecciones</span>
            <span className="text-slate-800 font-extrabold">
              {completedCount} de {totalCount} completadas ({percent}%)
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Listado de Lecciones */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base font-extrabold text-slate-800">
            Lecciones de la Materia
          </h2>
          <span className="font-heading text-xs font-bold text-slate-500">
            {lessons.length} {lessons.length === 1 ? "lección" : "lecciones"}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center font-heading text-sm font-bold text-slate-400">
            <div className="mx-auto mb-3 grid h-12 w-12 animate-spin place-items-center rounded-full border-4 border-blue-400 border-t-transparent text-xl">
              ⭐
            </div>
            Cargando lecciones disponibles...
          </div>
        ) : lessons.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#D5E5FF] bg-white p-7 text-center">
            <p className="text-sm font-bold text-slate-600">
              No hay lecciones registradas para esta materia aún.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map((lesson, idx) => {
              const isCompleted = isLessonItemCompleted(lesson, completedLessons);

              return (
                <article
                  key={lesson.id}
                  className={`relative rounded-3xl border-2 p-5 transition shadow-card flex flex-col justify-between ${
                    isCompleted
                      ? "border-emerald-300 bg-emerald-50/40 opacity-90"
                      : "border-[#E2E8F0] bg-white hover:border-[#0284C7] hover:shadow-soft"
                  }`}
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-heading text-base font-black ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isCompleted ? "✔" : idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lesson.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[10px] font-black text-blue-700">
                            <Sparkles className="h-3 w-3" />
                            <span>Práctica Oficial</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-black text-indigo-700">
                            <GraduationCap className="h-3 w-3" />
                            <span>Profesor</span>
                          </span>
                        )}
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                          {lesson.activityCount} retos
                        </span>
                      </div>
                      <h3 className="mt-1 font-heading text-base font-extrabold text-slate-800">
                        {lesson.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 font-medium leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de Acción */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>+{lesson.activityCount * 10} XP</span>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-4 py-2 font-heading text-xs font-extrabold text-emerald-800 cursor-not-allowed">
                      <CheckCircle className="h-4 w-4 stroke-[2.5]" />
                      <span>Completada</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0284C7] px-5 py-2.5 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] transition active:scale-95"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Jugar Lección</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      </section>
    </AppLayout>
  );
}
