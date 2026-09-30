import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  Info,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  createCustomExercise,
  createTeacherLesson,
  deleteCustomExercise,
  deleteTeacherLesson,
  getActivities,
  getClasses,
  getLessonExercises,
  getLessonStudentProgress,
  getTeacherLessons,
} from "../api";
import { useUser } from "../context/useUser";
import { getAvatarEmoji } from "../utils/avatarHelper";

const subjectLabels = {
  math: "Matemáticas ➕",
  spanish: "Español 📖",
  science: "Ciencias 🌿",
  geography: "Geografía 🌍",
};

const subjectIcons = {
  math: "➕",
  spanish: "📖",
  science: "🌿",
  geography: "🌍",
};

export default function TeacherExerciseScreen({ subject = "math", onBack = () => {} }) {
  const { user } = useUser();

  // Clases del profesor
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  // Lecciones creadas por el profesor para esta materia
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [currentLessonExercises, setCurrentLessonExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Modal para Crear Nueva Lección
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDescription, setNewLessonDescription] = useState("");
  const [creatingLesson, setCreatingLesson] = useState(false);

  // Modal para Seguimiento de Alumnos
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Modal para Crear Ejercicio según la Materia
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [points, setPoints] = useState(10);
  const [savingExercise, setSavingExercise] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Campos comunes
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [explanation, setExplanation] = useState("");

  // Campos específicos: Matemáticas
  const [mathQuestion, setMathQuestion] = useState("");
  const [mathCorrectAnswer, setMathCorrectAnswer] = useState("");
  const [mathDistractors, setMathDistractors] = useState(["", "", ""]);

  // Campos específicos: Español
  const [spanishType, setSpanishType] = useState("adivinanza"); // adivinanza, sinonimo, antonimo
  const [spanishClue, setSpanishClue] = useState("");
  const [spanishClueEmoji, setSpanishClueEmoji] = useState("🧩");
  const [spanishTargetWord, setSpanishTargetWord] = useState("");
  const [spanishHiddenIndices, setSpanishHiddenIndices] = useState(new Set()); // Índices de letras ocultas con "_"

  // Campos específicos: Geografía
  const [geoQuestion, setGeoQuestion] = useState("");
  const [geoCuriousFact, setGeoCuriousFact] = useState("");
  const [geoCorrectAnswer, setGeoCorrectAnswer] = useState("");
  const [geoDistractors, setGeoDistractors] = useState(["", "", ""]);

  // Campos específicos: Ciencias
  const [scienceTitle, setScienceTitle] = useState("");
  const [scienceInstruction, setScienceInstruction] = useState("Ordena las etapas del proceso desde el inicio:");
  const [scienceIcon, setScienceIcon] = useState("🌱");
  const [scienceStages, setScienceStages] = useState([
    { label: "Paso 1: Inicio", emoji: "🌱" },
    { label: "Paso 2: Crecimiento", emoji: "🌿" },
    { label: "Paso 3: Floración", emoji: "🌸" },
    { label: "Paso 4: Fruto", emoji: "🍎" },
  ]);

  // Cargar clases del docente
  useEffect(() => {
    if (!user?.id) return;
    getClasses(user.id)
      .then((data) => {
        const clsList = data.classes || [];
        setClasses(clsList);
        if (clsList.length > 0 && !selectedClassId) {
          setSelectedClassId(clsList[0].id);
        }
      })
      .catch((err) => console.error("Error al cargar clases:", err));
  }, [user?.id]);

  // Cargar lecciones del docente para esta materia y clase
  const loadLessons = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getTeacherLessons(user.id, subject, selectedClassId || "");
      const loadedLessons = data.lessons || [];
      setLessons(loadedLessons);

      if (loadedLessons.length > 0) {
        // Si no hay seleccionada o la seleccionada ya no existe, seleccionar la primera
        if (!selectedLessonId || !loadedLessons.some((l) => l.id === selectedLessonId)) {
          setSelectedLessonId(loadedLessons[0].id);
        }
      } else {
        setSelectedLessonId(null);
        setCurrentLessonExercises([]);
      }
    } catch (err) {
      console.error("Error al cargar lecciones del docente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [user?.id, subject, selectedClassId]);

  // Cargar ejercicios de la lección seleccionada
  const loadLessonExercises = async (lessonId) => {
    if (!lessonId) {
      setCurrentLessonExercises([]);
      return;
    }
    try {
      setLoadingExercises(true);
      const data = await getLessonExercises(lessonId, subject);
      setCurrentLessonExercises(data.exercises || []);
    } catch (err) {
      console.error("Error al cargar ejercicios de la lección:", err);
      setCurrentLessonExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    if (selectedLessonId) {
      loadLessonExercises(selectedLessonId);
    } else {
      setCurrentLessonExercises([]);
    }
  }, [selectedLessonId, subject]);

  // Actualizar letras ocultas de español automáticamente al cambiar palabra objetivo
  useEffect(() => {
    const cleanWord = spanishTargetWord.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ]/g, "").toUpperCase();
    if (cleanWord.length > 0) {
      // Por defecto, ocultar casillas intercaladas o de forma balanceada
      const hidden = new Set();
      for (let i = 0; i < cleanWord.length; i++) {
        if (i % 2 === 1 || (cleanWord.length > 5 && i === cleanWord.length - 2)) {
          hidden.add(i);
        }
      }
      // Garantizar que al menos una esté oculta
      if (hidden.size === 0 && cleanWord.length > 0) hidden.add(0);
      setSpanishHiddenIndices(hidden);
    } else {
      setSpanishHiddenIndices(new Set());
    }
  }, [spanishTargetWord]);

  // Crear una nueva lección
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) {
      alert("Por favor ingresa un título para la lección.");
      return;
    }
    try {
      setCreatingLesson(true);
      const res = await createTeacherLesson(user.id, {
        subject,
        classId: selectedClassId || null,
        title: newLessonTitle.trim(),
        description: newLessonDescription.trim(),
      });
      setIsLessonModalOpen(false);
      setNewLessonTitle("");
      setNewLessonDescription("");
      setSuccessMsg("¡Lección creada! Ahora puedes agregarle actividades.");
      setTimeout(() => setSuccessMsg(""), 3500);
      await loadLessons();
      if (res.lesson?.id) {
        setSelectedLessonId(res.lesson.id);
      }
    } catch (err) {
      alert(err.message || "Error al crear la lección.");
    } finally {
      setCreatingLesson(false);
    }
  };

  // Eliminar una lección completa
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("¿Deseas eliminar esta lección y todas sus actividades? Esta acción no se puede deshacer.")) return;
    try {
      await deleteTeacherLesson(user.id, lessonId);
      setSuccessMsg("Lección eliminada correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadLessons();
    } catch (err) {
      alert(err.message || "No se pudo eliminar la lección.");
    }
  };

  // Eliminar un ejercicio individual
  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm("¿Deseas eliminar esta actividad?")) return;
    try {
      await deleteCustomExercise(user.id, exerciseId);
      await loadLessonExercises(selectedLessonId);
      await loadLessons(); // actualiza contador de actividades
    } catch (err) {
      alert(err.message || "No se pudo eliminar la actividad.");
    }
  };

  // Ver seguimiento de alumnos para la lección activa
  const handleOpenStudentProgress = async () => {
    if (!selectedLessonId) return;
    setIsProgressModalOpen(true);
    setLoadingProgress(true);
    try {
      const data = await getLessonStudentProgress(user.id, selectedLessonId, selectedClassId);
      setStudentProgress(data);
    } catch (err) {
      console.error("Error al obtener progreso de alumnos:", err);
      setStudentProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Manejar creación de ejercicio dinámico según materia
  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!selectedLessonId) {
      setFormError("Debes seleccionar o crear una lección primero.");
      return;
    }

    setFormError("");
    setSavingExercise(true);

    try {
      let payload = {
        subject,
        lessonId: selectedLessonId,
        classId: selectedClassId || null,
        title: exerciseTitle.trim() || `Actividad de ${subjectLabels[subject]}`,
        points: Number(points) || 10,
        explanation: explanation.trim(),
      };

      if (subject === "math") {
        if (!mathQuestion.trim()) throw new Error("Escribe la pregunta matemática.");
        if (!mathCorrectAnswer.trim()) throw new Error("Escribe la respuesta correcta.");
        const distractors = mathDistractors.map((d) => d.trim()).filter(Boolean);
        if (distractors.length === 0) throw new Error("Agrega al menos una opción incorrecta (distractor).");
        const options = [mathCorrectAnswer.trim(), ...distractors];

        payload = {
          ...payload,
          question: mathQuestion.trim(),
          correctAnswer: mathCorrectAnswer.trim(),
          options,
          dataJson: {
            question: mathQuestion.trim(),
            options,
            correctAnswer: mathCorrectAnswer.trim(),
            explanation: explanation.trim(),
          },
        };
      } else if (subject === "spanish") {
        const cleanWord = spanishTargetWord.replace(/[^A-Za-zñÑáéíóúÁÉÍÓÚ]/g, "").toUpperCase();
        if (!spanishClue.trim()) throw new Error("Escribe la pista o adivinanza.");
        if (!cleanWord) throw new Error("Escribe la palabra secreta objetivo.");

        // Construir displayPattern con "_" para las letras ocultas
        const pattern = cleanWord.split("").map((letter, idx) => (spanishHiddenIndices.has(idx) ? "_" : letter));

        payload = {
          ...payload,
          question: spanishClue.trim(),
          correctAnswer: cleanWord,
          dataJson: {
            type: spanishType,
            clue: spanishClue.trim(),
            clueEmoji: spanishClueEmoji.trim() || "🧩",
            helperText:
              spanishType === "adivinanza"
                ? "¡Descubre la palabra misteriosa!"
                : spanishType === "sinonimo"
                ? "Escribe el sinónimo correspondiente"
                : "Escribe el antónimo opuesto",
            targetWord: cleanWord,
            displayPattern: pattern,
            explanation: explanation.trim() || `¡La palabra correcta es ${cleanWord}!`,
          },
        };
      } else if (subject === "geography") {
        if (!geoQuestion.trim()) throw new Error("Escribe la pregunta geográfica.");
        if (!geoCorrectAnswer.trim()) throw new Error("Escribe la respuesta correcta.");
        const distractors = geoDistractors.map((d) => d.trim()).filter(Boolean);
        if (distractors.length === 0) throw new Error("Agrega al menos una opción incorrecta.");
        const options = [geoCorrectAnswer.trim(), ...distractors];

        payload = {
          ...payload,
          question: geoQuestion.trim(),
          correctAnswer: geoCorrectAnswer.trim(),
          options,
          dataJson: {
            question: geoQuestion.trim(),
            curiousFact: geoCuriousFact.trim(),
            options,
            correctAnswer: geoCorrectAnswer.trim(),
            explanation: explanation.trim() || geoCuriousFact.trim(),
          },
        };
      } else if (subject === "science") {
        const pTitle = scienceTitle.trim() || "Proceso de la Naturaleza";
        const validStages = scienceStages.filter((st) => st.label.trim().length > 0);
        if (validStages.length < 3) {
          throw new Error("Debes definir al menos 3 o 4 etapas del ciclo en orden.");
        }

        const items = validStages.map((st, idx) => ({
          id: `step_${idx + 1}`,
          label: st.label.trim(),
          emoji: st.emoji.trim() || "🌿",
        }));
        const correctOrder = items.map((it) => it.id);

        payload = {
          ...payload,
          title: pTitle,
          question: scienceInstruction.trim() || "Ordena las etapas correctamente:",
          correctAnswer: "secuencia",
          dataJson: {
            title: pTitle,
            instruction: scienceInstruction.trim() || "Ordena cronológicamente este proceso:",
            icon: scienceIcon.trim() || "🌱",
            items,
            correctOrder,
            explanation: explanation.trim() || "¡Excelente! Has ordenado todas las fases correctamente.",
          },
        };
      }

      await createCustomExercise(user.id, payload);

      setSuccessMsg("¡Actividad guardada exitosamente!");
      setTimeout(() => setSuccessMsg(""), 3500);
      setIsExerciseModalOpen(false);

      // Limpiar estados
      setMathQuestion("");
      setMathCorrectAnswer("");
      setMathDistractors(["", "", ""]);
      setSpanishClue("");
      setSpanishTargetWord("");
      setGeoQuestion("");
      setGeoCuriousFact("");
      setGeoCorrectAnswer("");
      setGeoDistractors(["", "", ""]);
      setExplanation("");
      setExerciseTitle("");

      await loadLessonExercises(selectedLessonId);
      await loadLessons();
    } catch (err) {
      setFormError(err.message || "Error al guardar el ejercicio.");
    } finally {
      setSavingExercise(false);
    }
  };

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const exerciseCount = currentLessonExercises.length;
  const isLessonReady = exerciseCount >= 10;
  const missingCount = Math.max(0, 10 - exerciseCount);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] px-4 sm:px-6 md:px-8 py-5 sm:py-7 pb-28 text-slate-800">
      <div className="mx-auto max-w-lg md:max-w-3xl lg:max-w-5xl">
        {/* Cabecera Superior */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 font-heading text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 font-heading text-xs font-extrabold text-white shadow-button hover:bg-indigo-700 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Lección</span>
            </button>
          </div>
        </header>

        {/* Banner de Materia y Selector de Grupo */}
        <section className="mt-5 rounded-3xl border-2 border-[#D5E5FF] bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-3xl">
                {subjectIcons[subject] || "📚"}
              </span>
              <div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-heading text-[10px] font-extrabold text-blue-700 uppercase">
                  Editor Pedagógico
                </span>
                <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                  {subjectLabels[subject] || subject}
                </h1>
              </div>
            </div>
          </div>

          {/* Selector de clase escolar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              Filtrar por Clase Escolar:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-heading text-xs font-bold text-slate-700 outline-none focus:border-[#0284C7]"
            >
              <option value="">Todas mis clases</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.student_count} alumnos)
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Mensaje de éxito */}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-extrabold text-emerald-800 shadow-sm animate-in fade-in">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Selector de Lección Activa */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-heading text-xs font-black uppercase tracking-wider text-slate-500">
              Lecciones Disponibles ({lessons.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(true)}
              className="font-heading text-xs font-extrabold text-[#0284C7] hover:underline"
            >
              + Crear otra lección
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400">
              Cargando lecciones...
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#D5E5FF] bg-white p-6 text-center shadow-soft">
              <span className="text-3xl">📝</span>
              <h3 className="mt-2 font-heading text-base font-extrabold text-slate-800">
                Aún no has creado lecciones para esta materia
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Crea una lección (mínimo 10 actividades) para que tus alumnos puedan resolverla en clase.
              </p>
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0284C7] px-5 py-2.5 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Primera Lección</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {lessons.map((lesson) => {
                const isSelected = lesson.id === selectedLessonId;
                const isReady = Number(lesson.activity_count) >= 10;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`shrink-0 rounded-2xl border-2 px-4 py-2.5 text-left transition ${
                      isSelected
                        ? "border-[#0284C7] bg-sky-50/80 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-xs font-extrabold text-slate-800 line-clamp-1">
                        {lesson.title}
                      </span>
                      {isReady ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[9px] font-black">
                          ✔ Listo
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold">
                          {lesson.activity_count}/10
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Panel de la Lección Seleccionada */}
        {selectedLesson && (
          <section className="mt-5 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 font-heading text-[10px] font-extrabold text-indigo-700 uppercase">
                  Lección Seleccionada
                </span>
                <h2 className="mt-1 font-heading text-xl font-extrabold text-slate-800">
                  {selectedLesson.title}
                </h2>
                {selectedLesson.description && (
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">
                    {selectedLesson.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteLesson(selectedLesson.id)}
                title="Eliminar lección"
                className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Contador de actividades y Regla de 10 */}
            <div className="mt-4 rounded-2xl border p-3.5 bg-slate-50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading font-extrabold text-slate-700">
                  Actividades creadas:
                </span>
                <span
                  className={`font-heading font-black ${
                    isLessonReady ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {exerciseCount} / 10 actividades mínimas
                </span>
              </div>

              {/* Barra de progreso de actividades */}
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLessonReady ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(100, (exerciseCount / 10) * 100)}%` }}
                />
              </div>

              {/* Mensaje de estado */}
              {isLessonReady ? (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>
                    ¡Excelente! Esta lección está completa y disponible para tus alumnos.
                  </span>
                </div>
              ) : (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Faltan {missingCount} actividades para que los alumnos puedan verla y jugarla.
                  </span>
                </div>
              )}
            </div>

            {/* Botones de acción de la lección */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenStudentProgress}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white py-2.5 font-heading text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 transition active:scale-95"
              >
                <Users className="h-4 w-4 text-blue-600" />
                <span>Seguimiento de Alumnos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setIsExerciseModalOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0284C7] py-2.5 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>+ Agregar Actividad</span>
              </button>
            </div>
          </section>
        )}

        {/* Listado de Actividades de la Lección */}
        {selectedLesson && (
          <section className="mt-6">
            <h3 className="font-heading text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Actividades en esta lección ({currentLessonExercises.length})
            </h3>

            {loadingExercises ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Cargando actividades...
              </div>
            ) : currentLessonExercises.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Aún no has agregado ninguna actividad a esta lección.
                </p>
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(true)}
                  className="mt-3 font-heading text-xs font-extrabold text-[#0284C7] hover:underline"
                >
                  + Agregar la primera actividad ahora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentLessonExercises.map((ex, index) => (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                          {index + 1}
                        </span>
                        <div>
                          {/* Dinámica según materia */}
                          {subject === "spanish" && (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">{ex.clueEmoji || "🧩"}</span>
                                <span className="font-heading text-xs font-extrabold text-slate-800">
                                  {ex.clue}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center gap-1">
                                {(ex.displayPattern || []).map((letter, i) => (
                                  <span
                                    key={i}
                                    className={`grid h-7 w-7 place-items-center rounded-lg border text-xs font-heading font-black ${
                                      letter === "_"
                                        ? "border-dashed border-amber-400 bg-amber-50 text-amber-800"
                                        : "border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    {letter === "_" ? "?" : letter}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-1 text-[11px] font-bold text-emerald-700">
                                Palabra objetivo: {ex.targetWord}
                              </p>
                            </div>
                          )}

                          {subject === "science" && (
                            <div>
                              <h4 className="font-heading text-xs font-extrabold text-slate-800">
                                {ex.title || "Ciclo Natural"}
                              </h4>
                              <p className="text-[11px] text-slate-500">{ex.instruction}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {(ex.items || []).map((item, idx) => (
                                  <span
                                    key={item.id || idx}
                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-900"
                                  >
                                    <span>{item.emoji}</span>
                                    <span>{item.label}</span>
                                    {idx < (ex.items || []).length - 1 && (
                                      <span className="text-slate-300">→</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {subject === "geography" && (
                            <div>
                              <h4 className="font-heading text-xs font-extrabold text-slate-800">
                                {ex.question}
                              </h4>
                              {ex.curiousFact && (
                                <p className="mt-0.5 text-[11px] text-amber-700 font-semibold italic">
                                  💡 Pista: {ex.curiousFact}
                                </p>
                              )}
                              <p className="mt-1 text-xs font-bold text-emerald-700">
                                ✓ Correcta: {ex.correctAnswer}
                              </p>
                            </div>
                          )}

                          {subject === "math" && (
                            <div>
                              <h4 className="font-heading text-xs font-extrabold text-slate-800">
                                {ex.question}
                              </h4>
                              <p className="mt-1 text-xs font-bold text-emerald-700">
                                ✓ Respuesta: {ex.correctAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(ex.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MODAL 1: Crear Nueva Lección */}
      {isLessonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm sm:max-w-md rounded-3xl border-2 border-[#D5E5FF] bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading text-base font-extrabold text-slate-800">
                Nueva Lección de {subjectLabels[subject]}
              </h3>
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Título de la Lección *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lección 1: Sumas y Desafíos Espaciales"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-3.5 py-2.5 font-heading text-xs font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Descripción u Objetivo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Resuelve las operaciones matemáticas para desbloquear el trofeo."
                  value={newLessonDescription}
                  onChange={(e) => setNewLessonDescription(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-[11px] font-semibold text-blue-800">
                ℹ️ Recuerda que para que tus alumnos puedan resolver esta lección, deberás agregarle un mínimo de 10 actividades.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 font-heading text-xs font-extrabold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingLesson}
                  className="flex-1 rounded-full bg-[#0284C7] py-2.5 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] disabled:opacity-60"
                >
                  {creatingLesson ? "Creando..." : "Crear Lección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Seguimiento de Alumnos (Completados vs Pendientes) */}
      {isProgressModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md sm:max-w-lg rounded-3xl border-2 border-[#D5E5FF] bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 uppercase">
                  Seguimiento de Actividades
                </span>
                <h3 className="font-heading text-base font-extrabold text-slate-800 mt-0.5">
                  {selectedLesson?.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProgressModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingProgress ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                  Consultando estado de los alumnos...
                </div>
              ) : !studentProgress || studentProgress.totalStudents === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-semibold text-slate-500">
                    No hay alumnos inscritos en esta clase escolar todavía.
                  </p>
                </div>
              ) : (
                <>
                  {/* Resumen rápido */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                      <span className="font-heading text-2xl font-black text-emerald-700">
                        {studentProgress.completedCount}
                      </span>
                      <p className="font-heading text-xs font-extrabold text-emerald-800">
                        Completados ✔
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                      <span className="font-heading text-2xl font-black text-amber-700">
                        {studentProgress.pendingCount}
                      </span>
                      <p className="font-heading text-xs font-extrabold text-amber-800">
                        Pendientes ⏳
                      </p>
                    </div>
                  </div>

                  {/* Sección: Alumnos que ya completaron */}
                  <div>
                    <h4 className="font-heading text-xs font-extrabold uppercase text-emerald-800 mb-2">
                      Completaron la lección ({studentProgress.completedStudents.length})
                    </h4>
                    {studentProgress.completedStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Ningún alumno ha completado esta lección aún.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {studentProgress.completedStudents.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-sm">
                                {getAvatarEmoji(st.avatar)}
                              </span>
                              <div>
                                <p className="font-heading text-xs font-extrabold text-slate-800">
                                  {st.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {st.completedAt
                                    ? `Completado: ${new Date(st.completedAt).toLocaleDateString()}`
                                    : "Completado"}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-heading text-[10px] font-black text-emerald-800">
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                              <span>Listo</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sección: Alumnos con lección pendiente */}
                  <div>
                    <h4 className="font-heading text-xs font-extrabold uppercase text-amber-800 mb-2">
                      Alumnos Pendientes ({studentProgress.pendingStudents.length})
                    </h4>
                    {studentProgress.pendingStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        ¡Todos los alumnos de la clase han completado esta lección! 🎉
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {studentProgress.pendingStudents.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-sm">
                                {getAvatarEmoji(st.avatar)}
                              </span>
                              <div>
                                <p className="font-heading text-xs font-extrabold text-slate-800">
                                  {st.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  ⭐ {st.classPoints} pts acumulados
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-heading text-[10px] font-black text-amber-800">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Pendiente</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Crear Ejercicio Específico por Materia */}
      {isExerciseModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md sm:max-w-lg md:max-w-xl rounded-3xl border-2 border-[#D5E5FF] bg-white p-5 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
                  {selectedLesson?.title}
                </span>
                <h3 className="font-heading text-base font-extrabold text-slate-800">
                  Nueva Actividad de {subjectLabels[subject]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExerciseModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="mt-4 space-y-4">
              {/* DINÁMICA: MATEMÁTICAS */}
              {subject === "math" && (
                <>
                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Pregunta u Operación Matemática *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ej. ¿Cuánto es 45 + 38? o Si tienes 3 cajas con 6 lápices..."
                      value={mathQuestion}
                      onChange={(e) => setMathQuestion(e.target.value)}
                      className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-3.5 py-2 font-heading text-xs font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Respuesta Correcta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 83"
                      value={mathCorrectAnswer}
                      onChange={(e) => setMathCorrectAnswer(e.target.value)}
                      className="w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-3.5 py-2 font-heading text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Opciones Incorrectas / Distractores (3 requeridas)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          required
                          placeholder={`Falsa ${idx + 1}`}
                          value={mathDistractors[idx]}
                          onChange={(e) => {
                            const next = [...mathDistractors];
                            next[idx] = e.target.value;
                            setMathDistractors(next);
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DINÁMICA: ESPAÑOL (Adivinanzas, Sinónimos, Crucigrama) */}
              {subject === "spanish" && (
                <>
                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Tipo de Dinámica Pedagógica
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "adivinanza", label: "Adivinanza 🧩" },
                        { id: "sinonimo", label: "Sinónimo 🔄" },
                        { id: "antonimo", label: "Antónimo ⚡" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSpanishType(t.id)}
                          className={`rounded-xl py-2 font-heading text-[11px] font-extrabold transition border ${
                            spanishType === t.id
                              ? "bg-amber-100 border-amber-400 text-amber-900 shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-20">
                      <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                        Emoji
                      </label>
                      <input
                        type="text"
                        placeholder="🍌"
                        value={spanishClueEmoji}
                        onChange={(e) => setSpanishClueEmoji(e.target.value)}
                        className="w-full text-center text-xl rounded-2xl border-2 border-slate-200 bg-slate-50 py-1.5 outline-none focus:border-[#0284C7]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                        Pista o Enigma para el Alumno *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Oro parece, plata no es... ¿quién lo adivina?"
                        value={spanishClue}
                        onChange={(e) => setSpanishClue(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-3.5 py-2 font-heading text-xs font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Palabra Secreta / Objetivo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. PLATANO"
                      value={spanishTargetWord}
                      onChange={(e) => setSpanishTargetWord(e.target.value.toUpperCase())}
                      className="w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-3.5 py-2 font-heading text-xs font-black tracking-widest text-emerald-900 uppercase outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Selector interactivo de casillas ocultas */}
                  {spanishTargetWord.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                      <p className="font-heading text-xs font-extrabold text-amber-900 mb-1">
                        Configura las casillas a descubrir por el alumno:
                      </p>
                      <p className="text-[10px] text-amber-700 font-medium mb-2.5">
                        Toca cada letra para alternar entre visible o casilla oculta (?) que el alumno deberá escribir.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 justify-center">
                        {spanishTargetWord.split("").map((letter, idx) => {
                          const isHidden = spanishHiddenIndices.has(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const next = new Set(spanishHiddenIndices);
                                if (next.has(idx)) {
                                  next.delete(idx);
                                } else {
                                  next.add(idx);
                                }
                                setSpanishHiddenIndices(next);
                              }}
                              className={`grid h-10 w-10 place-items-center rounded-xl font-heading text-sm font-black transition shadow-sm ${
                                isHidden
                                  ? "border-2 border-amber-500 bg-amber-200 text-amber-900"
                                  : "border-2 border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              {isHidden ? "?" : letter}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* DINÁMICA: GEOGRAFÍA */}
              {subject === "geography" && (
                <>
                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Pregunta de Exploración Mundial *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ej. ¿Cuál es el río más caudaloso y largo del planeta?"
                      value={geoQuestion}
                      onChange={(e) => setGeoQuestion(e.target.value)}
                      className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-3.5 py-2 font-heading text-xs font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Dato Curioso o Pista Geográfica
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cruza la selva tropical más grande de América del Sur."
                      value={geoCuriousFact}
                      onChange={(e) => setGeoCuriousFact(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Respuesta Correcta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Río Amazonas"
                      value={geoCorrectAnswer}
                      onChange={(e) => setGeoCorrectAnswer(e.target.value)}
                      className="w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-3.5 py-2 font-heading text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Opciones Incorrectas (3 requeridas)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          required
                          placeholder={`Falsa ${idx + 1}`}
                          value={geoDistractors[idx]}
                          onChange={(e) => {
                            const next = [...geoDistractors];
                            next[idx] = e.target.value;
                            setGeoDistractors(next);
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DINÁMICA: CIENCIAS NATURALES (Ciclos y Procesos Ordenables) */}
              {subject === "science" && (
                <>
                  <div className="flex gap-2">
                    <div className="w-16">
                      <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                        Icono
                      </label>
                      <input
                        type="text"
                        value={scienceIcon}
                        onChange={(e) => setScienceIcon(e.target.value)}
                        className="w-full text-center text-xl rounded-2xl border border-slate-200 bg-slate-50 py-1.5 outline-none focus:border-[#0284C7]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                        Nombre del Ciclo o Proceso *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Metamorfosis de la Mariposa"
                        value={scienceTitle}
                        onChange={(e) => setScienceTitle(e.target.value)}
                        className="w-full rounded-2xl border-2 border-[#D5E5FF] bg-[#EFF6FF] px-3.5 py-2 font-heading text-xs font-bold text-slate-800 outline-none focus:border-[#0284C7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Instrucción para el Alumno
                    </label>
                    <input
                      type="text"
                      value={scienceInstruction}
                      onChange={(e) => setScienceInstruction(e.target.value)}
                      placeholder="Ej. Ordena cronológicamente las fases de la mariposa:"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Las 4 Etapas en el Orden Cronológico Correcto:
                    </label>
                    <div className="space-y-2">
                      {scienceStages.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-800">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Emoji"
                            value={stage.emoji}
                            onChange={(e) => {
                              const next = [...scienceStages];
                              next[idx].emoji = e.target.value;
                              setScienceStages(next);
                            }}
                            className="w-12 text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-base"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Nombre de la etapa ${idx + 1}`}
                            value={stage.label}
                            onChange={(e) => {
                              const next = [...scienceStages];
                              next[idx].label = e.target.value;
                              setScienceStages(next);
                            }}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#0284C7]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Explicación y Puntos (Comunes) */}
              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Explicación o Retroalimentación (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Mensaje educativo que verá el alumno al resolver la actividad"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-left font-heading text-xs font-extrabold uppercase text-slate-600 mb-1">
                  Puntos otorgados
                </label>
                <select
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-heading text-xs font-bold text-slate-700 outline-none"
                >
                  <option value={10}>10 Puntos (Estándar)</option>
                  <option value={20}>20 Puntos (Reto especial)</option>
                  <option value={50}>50 Puntos (Gran desafío)</option>
                </select>
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-center text-xs font-bold text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 py-2.5 font-heading text-xs font-extrabold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingExercise}
                  className="flex-1 rounded-full bg-[#0284C7] py-2.5 font-heading text-xs font-extrabold text-white shadow-button hover:bg-[#0369A1] disabled:opacity-60"
                >
                  {savingExercise ? "Guardando..." : "Guardar Actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
