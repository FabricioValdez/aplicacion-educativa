import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Plus,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { createClass, getClassStudents, getClasses } from "../api";
import { useUser } from "../context/useUser";
import { getAvatarEmoji } from "../utils/avatarHelper";
import AppLayout from "./AppLayout";

export default function TeacherClassesScreen({ onLogout, onNavigate, onManageExercises }) {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classSubject, setClassSubject] = useState("general");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [error, setError] = useState("");
  const [selectedClassStudents, setSelectedClassStudents] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const loadClasses = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getClasses(user.id);
      setClasses(data.classes || []);
    } catch (err) {
      console.error("Error al cargar clases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user?.id]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!className.trim()) {
      setError("Por favor ingresa un nombre para la clase.");
      return;
    }
    setError("");
    try {
      setCreating(true);
      await createClass(user.id, {
        name: className.trim(),
        description: classDescription.trim(),
        subject: classSubject,
      });
      setClassName("");
      setClassDescription("");
      setIsModalOpen(false);
      await loadClasses();
    } catch (err) {
      setError(err.message || "Error al crear la clase.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleViewStudents = async (cls) => {
    setSelectedClassStudents(cls);
    setLoadingStudents(true);
    try {
      const data = await getClassStudents(user.id, cls.id);
      setStudentsList(data.students || []);
    } catch (err) {
      console.error("Error al cargar alumnos:", err);
      setStudentsList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <AppLayout onLogout={onLogout} onNavigate={onNavigate} activeItem="clases" showHeader={false} maxWidth="max-w-5xl">
      <header className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 font-heading text-xs font-bold text-blue-700">
            <School className="h-3.5 w-3.5" />
            <span>Panel Docente</span>
          </span>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-slate-800">
            Mis Clases Escolares
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Gestiona tus grupos y códigos de acceso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-amber-500 text-lg shadow-sm hover:scale-105 active:scale-95 transition"
            title="Personalizar mi perfil"
          >
            {getAvatarEmoji(user?.avatar)}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#0284C7] px-4 py-2.5 font-heading text-xs font-extrabold text-white shadow-button transition hover:bg-[#0369A1] active:translate-y-[1px] touch-manipulation"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Clase</span>
          </button>
        </div>
      </header>

      {/* Listado de Clases */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="py-12 text-center font-heading text-sm font-bold text-slate-400">
            Cargando tus clases...
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#D5E5FF] bg-white p-7 text-center shadow-soft">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-3xl">
              🏫
            </div>
            <h3 className="mt-3 font-heading text-lg font-extrabold text-slate-800">
              ¡Aún no tienes clases creadas!
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-xs font-semibold text-slate-500">
              Crea tu primera clase para generar un código único que tus alumnos usarán para unirse.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0284C7] px-6 py-3 font-heading text-sm font-extrabold text-white shadow-button hover:bg-[#0369A1]"
            >
              <Plus className="h-4 w-4" />
              <span>Crear mi primera clase</span>
            </button>
          </div>
        ) : (
          classes.map((cls) => {
            const isCopied = copiedCode === cls.code;
            return (
              <div
                key={cls.id}
                className="relative rounded-3xl border-2 border-[#E2E8F0] bg-white p-5 shadow-card transition hover:border-blue-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 font-heading text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                      {cls.subject === "general" ? "General / Todas las Materias" : cls.subject}
                    </span>
                    <h2 className="mt-1 font-heading text-xl font-bold text-slate-800">
                      {cls.name}
                    </h2>
                    {cls.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">{cls.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-blue-50 px-3 py-1.5 font-heading text-xs font-extrabold text-[#0284C7]">
                    <Users className="h-4 w-4" />
                    <span>{cls.student_count} alumnos</span>
                  </div>
                </div>

                {/* Código Compartible */}
                <div className="mt-4 flex items-center justify-between rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80 px-4 py-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                      Código de acceso para alumnos:
                    </span>
                    <div className="font-heading text-2xl font-black tracking-widest text-amber-900">
                      {cls.code}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cls.code)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 font-heading text-xs font-bold transition shadow-sm ${
                      isCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-slate-700 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Botones de acción rápida */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewStudents(cls)}
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50 py-2 font-heading text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Ver lista de alumnos
                  </button>
                  <button
                    type="button"
                    onClick={() => onManageExercises && onManageExercises(cls)}
                    className="flex-1 rounded-full bg-[#0284C7] py-2 font-heading text-xs font-bold text-white hover:bg-[#0369A1] transition shadow-sm"
                  >
                    Crear ejercicios
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Modal para Crear Nueva Clase */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm sm:max-w-md rounded-3xl border-2 border-[#D5E5FF] bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-lg">🏫</span>
                <h3 className="font-heading text-lg font-extrabold text-slate-800">Nueva Clase</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="mt-4 space-y-4">
              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Nombre de la Clase *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Matemáticas 3° Primaria"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-4 py-3 font-heading text-sm font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Materia Principal
                </label>
                <select
                  value={classSubject}
                  onChange={(e) => setClassSubject(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-4 py-3 font-heading text-sm font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                >
                  <option value="general">General (Todas)</option>
                  <option value="math">Matemáticas</option>
                  <option value="spanish">Español</option>
                  <option value="science">Ciencias</option>
                  <option value="geography">Geografía</option>
                </select>
              </div>

              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Grupo matutino de exploración y retos."
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-4 py-2 font-heading text-xs font-medium text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </div>

              {error && (
                <p className="text-center text-xs font-bold text-red-600">{error}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 py-3 font-heading text-xs font-extrabold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-full bg-[#0284C7] py-3 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] disabled:opacity-60"
                >
                  {creating ? "Creando..." : "Crear y Generar Código"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alumnos en la Clase */}
      {selectedClassStudents && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border-2 border-[#D5E5FF] bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-800">
                  Alumnos Inscritos
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedClassStudents.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClassStudents(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingStudents ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                  Cargando alumnos...
                </div>
              ) : studentsList.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    Aún no hay alumnos inscritos en esta clase.
                  </p>
                  <p className="mt-1 text-xs text-amber-600 font-bold">
                    Comparte el código: {selectedClassStudents.code}
                  </p>
                </div>
              ) : (
                studentsList.map((st, index) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-heading text-xs font-extrabold text-slate-800">
                          {st.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Inscrito: {new Date(st.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-right">
                      <span className="font-heading text-xs font-black text-amber-700">
                        ⭐ {st.classPoints}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
