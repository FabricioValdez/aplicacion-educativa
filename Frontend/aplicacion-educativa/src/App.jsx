import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  addClassPoints,
  advanceDailyChallenge,
  confirmLivesPayment,
  createLivesCheckoutSession,
  getActivities,
  getClasses,
  getDailyChallenge,
  getLessonExercises,
  getSubjectLessons,
  login,
  logout,
  mockLivesCheckout,
  register,
  saveLessonProgress,
} from "./api";
import { UserProvider } from "./context/UserContext";
import { useUser } from "./context/useUser";
import AchievementsScreen from "./components/AchievementsScreen";
import AppLayout from "./components/AppLayout";
import CrosswordScreen from "./components/CrosswordScreen";
import GeographyQuizScreen from "./components/GeographyQuizScreen";
import LoginScreen from "./components/LoginScreen";
import MathQuizScreen from "./components/MathQuizScreen";
import MissionsScreen from "./components/MissionsScreen";
import PlantCycleScreen from "./components/PlantCycleScreen";
import ProfileScreen from "./components/ProfileScreen";
import RegisterScreen from "./components/RegisterScreen";
import ShopScreen from "./components/ShopScreen";
import StreakScreen from "./components/StreakScreen";
import StudentClassesModal from "./components/StudentClassesModal";
import SubjectLessonsScreen from "./components/SubjectLessonsScreen";
import TeacherClassesScreen from "./components/TeacherClassesScreen";
import TeacherExerciseScreen from "./components/TeacherExerciseScreen";
import { isLessonCompleted, isSubjectFullyCompleted } from "./utils/lessonHelper";

const subjectStyles = {
  math: { wrap: "bg-[#E0F2FE]", color: "#0284C7", badge: "bg-[#E0F2FE] text-[#0369A1]" },
  spanish: { wrap: "bg-[#FEF3C7]", color: "#D97706", badge: "bg-[#FEF3C7] text-[#B45309]" },
  science: { wrap: "bg-[#DCFCE7]", color: "#059669", badge: "bg-[#DCFCE7] text-[#047857]" },
  geography: { wrap: "bg-[#E0F2FE]", color: "#0284C7", badge: "bg-[#E0F2FE] text-[#0369A1]" },
};

function HomeScreen({
  activities = [],
  challenge,
  onSelectSubject,
  onLogout,
  onNavigate,
  onStreak,
  studentClasses = [],
  activeClass,
  onOpenClassesModal,
  subjectLessonsMap = {},
}) {
  const { user } = useUser();
  const isTeacher = user?.role === "adult";
  const completedLessons = user?.completedLessons || [];

  const isSubjectCompleted = (subId) => {
    const lessonsList = subjectLessonsMap[subId] || [];
    return isSubjectFullyCompleted(subId, lessonsList, completedLessons);
  };

  const completedCount = activities.filter((act) => isSubjectCompleted(act.id)).length;
  const totalCount = activities.length > 0 ? activities.length : (challenge?.total ?? 4);
  const percent = Math.min(100, Math.round((completedCount / totalCount) * 100));
  const isMissionComplete = completedCount >= totalCount;
  const nextPendingActivity = activities.find((act) => !isSubjectCompleted(act.id));

  const displayPoints = !isTeacher && activeClass ? activeClass.classPoints : user?.points;

  // Si es un niño recién registrado sin clases inscritas
  const isNewStudentWithoutClasses = !isTeacher && studentClasses.length === 0;

  return (
    <AppLayout
      onLogout={onLogout}
      onNavigate={onNavigate}
      onStreak={onStreak}
      displayPoints={displayPoints}
    >
      {/* Botón superior de clase activa para el alumno */}
      {!isTeacher && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onOpenClassesModal}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-[#D5E5FF] bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 text-left shadow-sm transition hover:border-[#0284C7] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-base">🏫</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Clase Escolar
                </span>
                <p className="font-heading text-sm font-extrabold text-slate-800">
                  {activeClass ? activeClass.name : "Unirse a una clase"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 font-heading text-xs font-black text-amber-800">
                ⭐ {activeClass?.classPoints ?? 0}
              </span>
              <span className="text-slate-400 font-bold text-xs">▼</span>
            </div>
          </button>
        </div>
      )}

      <header>
        <p className="font-heading text-[1.7rem] font-extrabold leading-tight text-slate-800">
          {isTeacher ? "¿Qué deseas preparar hoy?" : "¿Listo para aprender?"}
        </p>
        <h1 className="font-heading text-[2rem] font-extrabold leading-none text-slate-800">
          {isTeacher ? "Profesor / Tutor 👨‍🏫" : "Explorador 🚀"}
        </h1>
      </header>

      {/* Caso especial: Alumno nuevo sin ninguna clase asignada */}
      {isNewStudentWithoutClasses ? (
        <section className="mt-8 rounded-[2.5rem] border-2 border-[#D5E5FF] bg-white p-7 text-center shadow-soft">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-blue-50 text-5xl">
            🎒
          </div>
          <h2 className="mt-4 font-heading text-2xl font-black text-slate-800">
            ¡Hola, {user?.name || "Explorador"}!
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm font-semibold text-slate-600">
            Para desbloquear tus lecciones y comenzar tu aventura de aprendizaje, únete a la clase de tu profesor con tu código de acceso.
          </p>
          <button
            type="button"
            onClick={onOpenClassesModal}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0284C7] py-4 font-heading text-base font-extrabold text-white shadow-button hover:bg-[#0369A1] transition active:scale-95"
          >
            <span>🏫 Unirme a una Clase con Código</span>
          </button>
        </section>
      ) : (
        <>
          {/* Si es profesor, mostramos banner de acceso directo a sus clases */}
          {isTeacher && (
            <button
              type="button"
              onClick={() => onNavigate("clases")}
              className="mt-6 flex w-full items-center justify-between rounded-3xl border-2 border-blue-200 bg-gradient-to-r from-blue-600 to-sky-500 p-5 text-left text-white shadow-soft transition hover:opacity-95"
            >
              <div>
                <span className="rounded-full bg-white/20 px-3 py-1 font-heading text-xs font-extrabold">
                  Gestión Escolar
                </span>
                <h3 className="mt-2 font-heading text-xl font-extrabold">
                  Mis Clases y Alumnos
                </h3>
                <p className="mt-1 text-xs font-medium text-white/90">
                  Crea códigos y consulta los puntos de tus alumnos
                </p>
              </div>
              <span className="text-4xl">🏫</span>
            </button>
          )}

          {/* Tarjetas de Materias */}
          <section className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {activities.map((act) => {
              const style = subjectStyles[act.id] || {
                wrap: "bg-[#E0F2FE]",
                color: "#0284C7",
                badge: "bg-[#E0F2FE] text-[#0369A1]",
              };
              const isCompleted = !isTeacher && isSubjectCompleted(act.id);

              return (
                <button
                  type="button"
                  key={act.id}
                  disabled={isCompleted}
                  onClick={() => {
                    if (!isCompleted) {
                      onSelectSubject(act.id);
                    }
                  }}
                  className={`group relative rounded-3xl border-2 p-3.5 sm:p-4 text-left shadow-card transition duration-200 touch-manipulation ${
                    isCompleted
                      ? "border-emerald-300 bg-emerald-50/50 opacity-85 cursor-not-allowed"
                      : "border-[#E2E8F0] bg-white hover:-translate-y-1 active:translate-y-0"
                  }`}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${style.wrap}`}
                      style={{ color: style.color }}
                    >
                      <span className="font-heading text-2xl font-extrabold">{act.icon}</span>
                    </div>
                    {isTeacher ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">
                        Crear ✏️
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 shadow-sm">
                        <svg className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Listo</span>
                      </span>
                    ) : null}
                  </div>
                  <h2 className="font-heading text-lg font-bold text-slate-800">{act.subject}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500 truncate">
                    {isTeacher ? "Gestionar retos" : act.title}
                  </p>
                </button>
              );
            })}
          </section>

          {/* Reto del Día (solo visible para alumnos) */}
          {!isTeacher && (
            <section className="mt-6 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                    Reto del Día
                  </p>
                  <h3 className="mt-2 font-heading text-[1.55rem] font-extrabold leading-tight text-slate-800">
                    {challenge?.title || "Misión Espacial Secreta"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 leading-snug">
                    {challenge?.description || "Completa las 4 lecciones para ganar un super cofre con 100 gemas galácticas."}
                  </p>
                </div>
                <div className="rounded-full bg-[#DCFCE7] px-3 py-2 font-heading text-sm font-bold text-[#047857] shrink-0">
                  {completedCount}/{totalCount}
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
                  <span>Progreso</span>
                  <span className="text-[#047857]">{completedCount}/{totalCount}</span>
                </div>
                <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#E2E8F0] text-left shadow-inner">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#34D399] to-[#10B981] transition-all duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (nextPendingActivity) {
                    onSelectSubject(nextPendingActivity.id);
                  }
                }}
                disabled={isMissionComplete}
                className={`mt-6 flex w-full items-center justify-center rounded-full px-5 py-4 font-heading text-lg font-extrabold text-white shadow-button transition duration-200 ${
                  isMissionComplete
                    ? "bg-emerald-600 cursor-not-allowed opacity-90 shadow-none"
                    : "bg-[#0284C7] hover:bg-[#0369A1] active:scale-[0.98]"
                }`}
              >
                {isMissionComplete
                  ? "¡Misión Cumplida! 🎉"
                  : nextPendingActivity
                  ? `¡Jugar ${nextPendingActivity.subject}! 🚀`
                  : "¡Jugar Ahora!"}
              </button>
            </section>
          )}
        </>
      )}
    </AppLayout>
  );
}

function AppContent() {
  const { user, setUser, loading, fetchUserProfile, checkStreak, clearUser } = useUser();
  const paymentSessionId = new URLSearchParams(window.location.search).get("stripe_session_id");
  const storedResume = sessionStorage.getItem("questworld_quiz_resume");

  const [currentScreen, setCurrentScreen] = useState(
    user ? (paymentSessionId && storedResume ? "math" : "home") : "login"
  );
  const [challenge, setChallenge] = useState(null);
  const [activities, setActivities] = useState([]);
  const [resume, setResume] = useState(() => {
    try {
      return paymentSessionId && storedResume && storedResume !== "undefined"
        ? JSON.parse(storedResume)
        : null;
    } catch {
      return null;
    }
  });
  const [isRestoringPayment, setIsRestoringPayment] = useState(Boolean(paymentSessionId && user));
  const [showMissionBonusModal, setShowMissionBonusModal] = useState(false);

  // Estados de Clases Escolares
  const [studentClasses, setStudentClasses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [isClassesModalOpen, setIsClassesModalOpen] = useState(false);
  const [teacherSubject, setTeacherSubject] = useState("math");

  // Estados de Lecciones y Materias
  const [selectedSubject, setSelectedSubject] = useState("math");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [subjectLessonsMap, setSubjectLessonsMap] = useState({});

  const goHome = () => {
    setSelectedLesson(null);
    setCurrentScreen("home");
  };

  const handleNavigate = (itemId) => {
    if (itemId === "inicio") {
      setSelectedLesson(null);
      setCurrentScreen("home");
    }
    if (itemId === "misiones" || itemId === "liga") setCurrentScreen("liga");
    if (itemId === "clases") setCurrentScreen("classes");
    if (itemId === "logros") setCurrentScreen("achievements");
    if (itemId === "tienda" || itemId === "shop") setCurrentScreen("shop");
    if (itemId === "profile" || itemId === "perfil") setCurrentScreen("profile");
  };

  const handleStreak = () => setCurrentScreen("streak");
  const userId = user?.id;

  // Cargar clases del alumno o docente
  const loadUserClasses = async (uid) => {
    if (!uid) return;
    try {
      const data = await getClasses(uid);
      const cls = data.classes || [];
      setStudentClasses(cls);
      if (cls.length > 0) {
        setActiveClass((prev) => {
          if (!prev) return cls[0];
          const found = cls.find((c) => c.id === prev.id);
          return found || cls[0];
        });
      } else {
        setActiveClass(null);
      }
    } catch (e) {
      console.warn("No se pudieron cargar clases:", e);
    }
  };

  // Cargar el mapa de lecciones de todas las materias
  const loadSubjectLessons = async (uid, classId = null) => {
    if (!uid) return;
    try {
      const subjects = ["math", "spanish", "science", "geography"];
      const results = await Promise.all(
        subjects.map((sub) => getSubjectLessons(uid, sub, classId).catch(() => ({ lessons: [] })))
      );
      const newMap = {};
      subjects.forEach((sub, i) => {
        newMap[sub] = results[i]?.lessons || [];
      });
      setSubjectLessonsMap(newMap);
    } catch (e) {
      console.warn("No se pudieron cargar lecciones por materia:", e);
    }
  };

  useEffect(() => {
    if (!userId) return;
    getDailyChallenge(userId)
      .then(({ challenge: currentChallenge }) => setChallenge(currentChallenge))
      .catch(() => setChallenge(null));

    getActivities(userId)
      .then((data) => setActivities(data.activities || []))
      .catch(() => setActivities([]));

    loadUserClasses(userId);
    loadSubjectLessons(userId, activeClass?.id);
  }, [userId, activeClass?.id]);

  useEffect(() => {
    if (!paymentSessionId || !user) return;
    confirmLivesPayment(user.id, paymentSessionId)
      .then(async (res) => {
        await fetchUserProfile(user.id);
        if (res?.packageType === "streak_shield" || res?.packageType === "vip_subscription") {
          setCurrentScreen("shop");
        } else {
          setResume(storedResume ? JSON.parse(storedResume) : null);
        }
        sessionStorage.removeItem("questworld_quiz_resume");
      })
      .catch(() => {
        sessionStorage.removeItem("questworld_quiz_resume");
        setCurrentScreen("home");
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsRestoringPayment(false);
      });
  }, [paymentSessionId, user, storedResume]);

  const handleLogin = async (credentials) => {
    const { user: loggedInUser } = await login(credentials);
    setUser(loggedInUser);
    await checkStreak(loggedInUser.id);
    await loadUserClasses(loggedInUser.id);
    await loadSubjectLessons(loggedInUser.id);
    if (loggedInUser.role === "adult") {
      setCurrentScreen("classes");
    } else {
      goHome();
    }
  };

  const handleRegister = async (userData) => {
    const { user: registeredUser } = await register(userData);
    setUser(registeredUser);
    await checkStreak(registeredUser.id);
    await loadUserClasses(registeredUser.id);
    await loadSubjectLessons(registeredUser.id);
    if (registeredUser.role === "adult") {
      setCurrentScreen("classes");
    } else {
      goHome();
    }
  };

  const handleAdvanceChallenge = async () => {
    if (!user || !challenge || challenge.completed >= challenge.total) return;
    const progress = await advanceDailyChallenge(user.id);
    setChallenge((current) => ({ ...current, completed: progress.completed }));
  };

  const handleLogout = async () => {
    if (user) await logout(user.id);
    clearUser();
    sessionStorage.removeItem("questworld_quiz_resume");
    setChallenge(null);
    setStudentClasses([]);
    setActiveClass(null);
    setCurrentScreen("login");
  };

  const handleLivesRefill = async () => {
    const hasStripePublishableKey = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    const useMockPayments = import.meta.env.VITE_MOCK_PAYMENTS === "true" || !hasStripePublishableKey;

    if (useMockPayments) {
      return mockLivesCheckout(user.id);
    }

    const { sessionId, url } = await createLivesCheckoutSession(user.id);
    const stripe = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) : null;
    if (stripe && sessionId) {
      const result = await stripe.redirectToCheckout({ sessionId });
      if (result?.error) throw result.error;
      return;
    }
    if (url) {
      window.location.assign(url);
      return;
    }
    throw new Error("Stripe no está configurado en el frontend.");
  };

  const handleActivityComplete = async (payload) => {
    if (!user?.id) return;
    try {
      if (payload?.completedLesson) {
        const result = await saveLessonProgress(user.id, {
          completedLesson: payload.completedLesson,
          score: payload.pointsEarned ?? 10,
        });
        if (result?.bonusAwarded) {
          setShowMissionBonusModal(true);
        }
      }

      // Si el alumno tiene una clase activa, sumarle los puntos a la clase también
      if (activeClass?.id && payload?.pointsEarned) {
        try {
          const res = await addClassPoints(user.id, activeClass.id, payload.pointsEarned);
          setActiveClass((prev) => prev ? { ...prev, classPoints: res.classPoints } : null);
          setStudentClasses((prev) =>
            prev.map((c) => (c.id === activeClass.id ? { ...c, classPoints: res.classPoints } : c))
          );
        } catch (e) {
          console.warn("No se pudieron sumar puntos a la clase:", e);
        }
      }

      const profile = await fetchUserProfile(user.id);
      if (profile) {
        setChallenge((current) => current ? { ...current, completed: profile.completedChallenges ?? current.completed } : current);
      }
      await loadSubjectLessons(user.id, activeClass?.id);
    } catch (e) {
      console.warn("Aviso al refrescar tras lección:", e);
    }
  };

  const handleSubjectSelect = (subjectId) => {
    if (user?.role === "adult") {
      setTeacherSubject(subjectId);
      setCurrentScreen("teacher-exercise");
    } else {
      setSelectedSubject(subjectId);
      setCurrentScreen("subject-lessons");
    }
  };

  if (loading && !user) return <div className="grid min-h-screen place-items-center bg-[#F8FAFC] font-heading text-lg font-extrabold text-[#0284C7]">Cargando tu aventura...</div>;
  if (isRestoringPayment) return <div className="grid min-h-screen place-items-center bg-[#F8FAFC] font-heading text-lg font-extrabold text-[#0284C7]">Confirmando tu recarga...</div>;

  if (currentScreen === "login") {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigateToRegister={() => setCurrentScreen("register")}
      />
    );
  }

  if (currentScreen === "register") {
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onNavigateToLogin={() => setCurrentScreen("login")}
      />
    );
  }

  if (currentScreen === "classes") {
    return (
      <TeacherClassesScreen
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onManageExercises={(cls) => {
          setTeacherSubject(cls.subject === "general" ? "math" : cls.subject);
          setCurrentScreen("teacher-exercise");
        }}
      />
    );
  }

  if (currentScreen === "teacher-exercise") {
    return (
      <TeacherExerciseScreen
        subject={teacherSubject}
        onBack={goHome}
      />
    );
  }

  if (currentScreen === "subject-lessons") {
    return (
      <SubjectLessonsScreen
        subject={selectedSubject}
        activeClass={activeClass}
        onBack={goHome}
        onSelectLesson={async (lesson) => {
          let fullLesson = lesson;
          if (!lesson.isDefault && (!lesson.exercises || lesson.exercises.length === 0)) {
            try {
              const res = await getLessonExercises(lesson.id, selectedSubject);
              fullLesson = { ...lesson, exercises: res.exercises || [] };
            } catch (err) {
              console.warn("Error al cargar ejercicios de la lección:", err);
            }
          }
          setSelectedLesson(fullLesson);
          setCurrentScreen(selectedSubject);
        }}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onStreak={handleStreak}
      />
    );
  }

  if (currentScreen === "math") {
    return (
      <MathQuizScreen
        onBack={() => setCurrentScreen("subject-lessons")}
        onComplete={handleActivityComplete}
        onRefill={handleLivesRefill}
        resume={resume}
        lessonData={selectedLesson}
      />
    );
  }

  if (currentScreen === "missions" || currentScreen === "liga") {
    return (
      <MissionsScreen
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        activeClass={activeClass}
      />
    );
  }
  if (currentScreen === "achievements") return <AchievementsScreen onLogout={handleLogout} onNavigate={handleNavigate} />;
  if (currentScreen === "streak") return <StreakScreen onBack={goHome} />;
  if (currentScreen === "profile") return <ProfileScreen onBack={goHome} onLogout={handleLogout} />;
  if (currentScreen === "shop") {
    return (
      <ShopScreen
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onStreak={handleStreak}
      />
    );
  }
  if (currentScreen === "spanish") {
    return (
      <CrosswordScreen
        onBack={() => setCurrentScreen("subject-lessons")}
        onComplete={handleActivityComplete}
        onRefill={handleLivesRefill}
        lessonData={selectedLesson}
      />
    );
  }
  if (currentScreen === "science") {
    return (
      <PlantCycleScreen
        onBack={() => setCurrentScreen("subject-lessons")}
        onComplete={handleActivityComplete}
        onRefill={handleLivesRefill}
        lessonData={selectedLesson}
      />
    );
  }
  if (currentScreen === "geography") {
    return (
      <GeographyQuizScreen
        onBack={() => setCurrentScreen("subject-lessons")}
        onComplete={handleActivityComplete}
        onRefill={handleLivesRefill}
        lessonData={selectedLesson}
      />
    );
  }

  return (
    <>
      <HomeScreen
        activities={activities}
        challenge={challenge}
        onAdvanceChallenge={handleAdvanceChallenge}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onStreak={handleStreak}
        onSelectSubject={handleSubjectSelect}
        studentClasses={studentClasses}
        activeClass={activeClass}
        onOpenClassesModal={() => setIsClassesModalOpen(true)}
        subjectLessonsMap={subjectLessonsMap}
      />

      {/* Modal para que el Alumno cambie de clase o ingrese código */}
      <StudentClassesModal
        isOpen={isClassesModalOpen}
        onClose={() => setIsClassesModalOpen(false)}
        classes={studentClasses}
        activeClass={activeClass}
        onSelectClass={(cls) => setActiveClass(cls)}
        onClassJoined={async () => {
          await loadUserClasses(user?.id);
        }}
      />

      {showMissionBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border-4 border-amber-300">
            <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-4xl shadow-lg">
              🎁
            </div>
            <h3 className="font-heading text-2xl font-black text-slate-800">
              ¡Misión Espacial Cumplida!
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              ¡Completaste todas las 4 materias del día con éxito!
            </p>
            <div className="my-4 inline-flex items-center gap-2 rounded-2xl bg-amber-100 px-4 py-2 border border-amber-300 font-heading text-xl font-black text-amber-800">
              <span>⭐ +100 Gemas Galácticas</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMissionBonusModal(false)}
              className="mt-2 w-full rounded-full bg-[#0284C7] py-3.5 font-heading text-base font-extrabold text-white shadow-button hover:bg-[#0369A1] transition"
            >
              ¡Genial! 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
