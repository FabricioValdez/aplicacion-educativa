import { useEffect, useState } from "react";
import { getActivity, submitActivityAnswer } from "../api";
import { useUser } from "../context/useUser";
import { defaultGeographyQuestions } from "../data/lessonsData";
import ActivityLayout from "./ActivityLayout";
import ProgressBar from "./common/ProgressBar";
import { Lives, GameOverModal, SummaryScreen } from "./common/GameModals";

const optionLetters = ["A", "B", "C", "D"];
const questionIcons = ["🌊", "🏛️", "🧭", "🪐", "🏔️", "🏜️", "💧", "❄️", "🌐", "🌴"];

export default function GeographyQuizScreen({
  onBack = () => {},
  onComplete = async () => {},
  onRefill = async () => {},
  lessonData = null,
}) {
  const { user, addPoints } = useUser();

  const [questions, setQuestions] = useState(() => {
    if (Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0) {
      return lessonData.exercises;
    }
    return defaultGeographyQuestions;
  });
  const [activityMeta, setActivityMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lives, setLives] = useState(3);
  const [showGameOver, setShowGameOver] = useState(false);
  const [shakingLife, setShakingLife] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar actividad dinámica desde el backend para sincronizar metadatos
  useEffect(() => {
    if (Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0) {
      setQuestions(lessonData.exercises);
      return;
    }

    if (!user?.id) return;
    let isCurrent = true;

    getActivity(user.id, "geography")
      .then((data) => {
        if (!isCurrent) return;
        const fetchedActivity = data.activity;
        setActivityMeta(fetchedActivity);
        if (Array.isArray(fetchedActivity?.questions) && fetchedActivity.questions.length > 0) {
          setQuestions(
            fetchedActivity.questions.map((q, idx) => ({
              ...defaultGeographyQuestions[idx],
              ...q,
              correctAnswer: q.correctAnswer || defaultGeographyQuestions[idx]?.correctAnswer,
              explanation: q.explanation || defaultGeographyQuestions[idx]?.explanation,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Usando catálogo local de geografía:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, lessonData]);

  // Temporizador de sesión
  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Objeto de la pregunta actual reactivo
  const currentQuestion = questions[currentIndex] || defaultGeographyQuestions[currentIndex] || defaultGeographyQuestions[0];

  const selectAnswer = async (option) => {
    if (isAnswered || lives === 0 || !currentQuestion) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    // Validación 100% pura y local contra currentQuestion
    const isCorrect = String(option).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();

    if (isCorrect) {
      setScore((val) => val + 10);
      setCorrectCount((val) => val + 1);
    } else {
      if (!user?.hasSubscription) {
        setShakingLife(true);
        setLives((l) => {
          const nextLives = Math.max(0, l - 1);
          if (nextLives === 0) setShowGameOver(true);
          return nextLives;
        });
        window.setTimeout(() => setShakingLife(false), 500);
      }
    }

    // Sincronizar en segundo plano con el backend
    submitActivityAnswer(user?.id, "geography", {
      questionId: currentQuestion.id,
      id: currentQuestion.id,
      currentIndex,
      questionText: currentQuestion.question || "",
      answer: String(option).trim(),
    }).catch(() => {});
  };

  const refillLives = async () => {
    setPaymentError("");
    setIsPaying(true);
    try {
      const payment = await onRefill();
      if (payment?.success) {
        setLives(payment.lives ?? 3);
        setShowGameOver(false);
      }
    } catch (error) {
      setPaymentError(error.message || "Error al recargar vidas.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleFinish = async () => {
    setIsComplete(true);
    if (score > 0) {
      try {
        await addPoints(score, "geography_completion");
      } catch (err) {
        console.error("Error al sumar puntos acumulados:", err);
      }
    }
    if (onComplete) {
      setIsSaving(true);
      try {
        const lessonKey = lessonData?.isDefault
          ? "geografia"
          : (lessonData?.id ? (String(lessonData.id).startsWith("lesson_") ? lessonData.id : `lesson_${lessonData.id}`) : "geografia");

        await onComplete({
          pointsEarned: score,
          completedLesson: lessonKey,
          elapsedSeconds,
          correctCount,
        });
      } catch (err) {
        console.error("Error al guardar progreso de geografía:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex >= questions.length - 1) {
      handleFinish();
      return;
    }

    // Limpiar completamente el estado de la respuesta anterior
    setCurrentIndex((val) => val + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  if (isComplete) {
    return (
      <SummaryScreen
        elapsedSeconds={elapsedSeconds}
        correctCount={correctCount}
        score={score}
        onBack={onBack}
        totalQuestions={questions.length}
        subjectTitle="¡Explorador del Planeta Tierra!"
        badgeEmoji="🌐"
      />
    );
  }

  // Evaluación estricta y reactiva de la pregunta actual
  const isCorrect =
    isAnswered &&
    String(selectedAnswer).trim().toLowerCase() === String(currentQuestion?.correctAnswer).trim().toLowerCase();

  const feedback = isCorrect
    ? "¡Excelente! " + currentQuestion.explanation
    : "¡Casi! La respuesta correcta era " + currentQuestion.correctAnswer + ". " + currentQuestion.explanation;

  const actionFooter = isAnswered && (
    <div
      className={`rounded-3xl border-2 p-4 transition-all duration-300 shadow-[0_4px_0_rgba(0,0,0,0.05)] ${
        isCorrect ? "border-[#86EFAC] bg-[#DCFCE7]" : "border-[#FCA5A5] bg-[#FEF2F2]"
      }`}
    >
      <div className="flex items-start gap-3 text-left">
        <span className="text-3xl">{isCorrect ? "🌍" : "💡"}</span>
        <div className="flex-1">
          <p className="font-heading text-base font-extrabold text-slate-800">{feedback}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={currentIndex === questions.length - 1 ? handleFinish : nextQuestion}
        disabled={isSaving}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#0284C7] px-5 font-heading text-lg font-extrabold text-white shadow-button transition active:scale-95 disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : currentIndex === questions.length - 1 ? "Ver Resultados 🏆" : "Siguiente Pregunta ➔"}
      </button>
    </div>
  );

  const themeIcon = questionIcons[currentIndex % questionIcons.length] || "🌍";

  return (
    <>
      <ActivityLayout
        onBack={onBack}
        title={lessonData?.title || activityMeta?.title || "Mundo Explorador"}
        icon={activityMeta?.icon || "🌐"}
        counter={<Lives lives={lives} shaking={shakingLife} infinite={Boolean(user?.hasSubscription)} />}
        actionFooter={actionFooter}
      >
        <ProgressBar
          current={currentIndex + 1}
          total={questions.length}
          label={`Desafío ${currentIndex + 1} de ${questions.length}`}
        />

        <section className="mt-4 rounded-3xl border-2 border-[#DCE6F2] bg-white p-5 text-center shadow-card">
          <div className="inline-block rounded-full bg-[#E0F2FE] px-3 py-1 font-heading text-xs font-extrabold text-[#0369A1]">
            🧭 Trivia del Mundo
          </div>

          <h1 className="mt-3 font-heading text-xl sm:text-2xl font-extrabold leading-tight text-slate-800">
            {currentQuestion.question}
          </h1>

          {currentQuestion.helperText && (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              💡 {currentQuestion.helperText}
            </p>
          )}

          {/* Banner temático decorativo */}
          <div className="mt-4 grid h-24 place-items-center rounded-2xl bg-[#E0F7FA] text-5xl shadow-inner">
            {themeIcon} 🗺️ ✨
          </div>

          {/* Opciones de respuesta estilo A, B, C, D */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswer =
                isAnswered &&
                String(option).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase();

              const stateClass = !isAnswered
                ? "border-[#E2E8F0] bg-white hover:border-[#0284C7] hover:bg-[#F0F9FF]"
                : isAnswer
                ? "border-[#10B981] bg-[#A7F3D0]"
                : isSelected
                ? "border-[#EF4444] bg-[#FECACA]"
                : "border-[#E2E8F0] bg-white opacity-50";

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered || lives === 0}
                  onClick={() => selectAnswer(option)}
                  className={`flex min-h-[68px] sm:min-h-[76px] items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border-2 p-2.5 sm:p-3.5 shadow-[0_4px_0_rgba(148,163,184,0.15)] transition active:translate-y-[1px] touch-manipulation ${stateClass}`}
                >
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#E2E8F0] font-heading font-extrabold text-slate-700 text-xs sm:text-sm">
                    {optionLetters[index]}
                  </span>
                  <span className="flex-1 text-left font-heading text-sm sm:text-base font-extrabold text-slate-800 line-clamp-2">
                    {option}
                  </span>
                  {isAnswered && isAnswer && (
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#059669] text-white text-sm sm:text-base font-black">
                      ✓
                    </span>
                  )}
                  {isAnswered && isSelected && !isAnswer && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-white text-base font-black">
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-28" />
      </ActivityLayout>

      {showGameOver && (
        <GameOverModal
          onRefill={refillLives}
          onExit={onBack}
          isPaying={isPaying}
          error={paymentError}
        />
      )}
    </>
  );
}
