import { useEffect, useState } from "react";
import { getActivity, submitActivityAnswer } from "../api";
import { useUser } from "../context/useUser";
import { defaultMathQuestions } from "../data/lessonsData";
import ActivityLayout from "./ActivityLayout";
import ProgressBar from "./common/ProgressBar";
import { Lives, GameOverModal, SummaryScreen } from "./common/GameModals";

const optionLetters = ["A", "B", "C", "D"];

export default function MathQuizScreen({
  onBack = () => {},
  onComplete = async () => {},
  onRefill = async () => {},
  resume,
  lessonData = null,
}) {
  const { user, addPoints } = useUser();

  const [questions, setQuestions] = useState(() => {
    if (Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0) {
      return lessonData.exercises;
    }
    return defaultMathQuestions;
  });
  const [activityMeta, setActivityMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(resume?.currentIndex ?? 0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const [score, setScore] = useState(resume?.score ?? 0);
  const [correctCount, setCorrectCount] = useState(resume?.correctCount ?? 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(resume?.elapsedSeconds ?? 0);
  const [lives, setLives] = useState(3);
  const [showGameOver, setShowGameOver] = useState(false);
  const [shakingLife, setShakingLife] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar si nos pasan una lección con ejercicios específicos
  useEffect(() => {
    if (Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0) {
      setQuestions(lessonData.exercises);
      return;
    }

    if (!user?.id) return;
    let isCurrent = true;

    getActivity(user.id, "math")
      .then((data) => {
        if (!isCurrent) return;
        const fetchedActivity = data.activity;
        setActivityMeta(fetchedActivity);
        if (Array.isArray(fetchedActivity?.questions) && fetchedActivity.questions.length > 0) {
          setQuestions(
            fetchedActivity.questions.map((q, idx) => ({
              ...defaultMathQuestions[idx],
              ...q,
              correctAnswer: q.correctAnswer || defaultMathQuestions[idx]?.correctAnswer,
              explanation: q.explanation || defaultMathQuestions[idx]?.explanation,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Usando catálogo local de matemáticas:", err);
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, lessonData]);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Objeto de la pregunta actual reactivo
  const currentQuestion = questions[currentIndex] || defaultMathQuestions[currentIndex] || defaultMathQuestions[0];

  const selectAnswer = async (answer) => {
    if (isAnswered || lives === 0 || !currentQuestion) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    // Validación 100% pura y local contra currentQuestion
    const isCorrect = String(answer).trim() === String(currentQuestion.correctAnswer).trim();

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
        window.setTimeout(() => setShakingLife(false), 450);
      }
    }

    // Reportar respuesta en segundo plano al backend
    submitActivityAnswer(user?.id, "math", {
      questionId: currentQuestion.id,
      id: currentQuestion.id,
      currentIndex,
      questionText: currentQuestion.question || "",
      answer: String(answer).trim(),
    }).catch((err) => console.warn("Sincronización en segundo plano:", err));
  };

  const refillLives = async () => {
    setPaymentError("");
    setIsPaying(true);
    sessionStorage.setItem(
      "questworld_quiz_resume",
      JSON.stringify({ currentIndex, score, correctCount, elapsedSeconds })
    );
    try {
      const payment = await onRefill();
      if (payment?.success) {
        setLives(payment.lives ?? 3);
        setShowGameOver(false);
        sessionStorage.removeItem("questworld_quiz_resume");
      }
      setIsPaying(false);
    } catch (error) {
      sessionStorage.removeItem("questworld_quiz_resume");
      setPaymentError(error.message);
      setIsPaying(false);
    }
  };

  const handleFinish = async () => {
    setIsComplete(true);
    if (score > 0) {
      try {
        await addPoints(score, "math_completion");
      } catch (e) {
        console.error("Error al sumar puntos acumulados:", e);
      }
    }
    if (onComplete) {
      setIsSaving(true);
      try {
        const lessonKey = lessonData?.isDefault
          ? "matematicas"
          : (lessonData?.id ? (String(lessonData.id).startsWith("lesson_") ? lessonData.id : `lesson_${lessonData.id}`) : "matematicas");

        await onComplete({ pointsEarned: score, completedLesson: lessonKey, elapsedSeconds, correctCount });
      } catch (e) {
        console.error("Error al registrar fin de lección:", e);
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
    setCurrentIndex((value) => value + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F8FAFC] p-4 text-center font-heading">
        <div>
          <div className="mx-auto mb-4 grid h-20 w-20 animate-bounce place-items-center rounded-full bg-[#E0F2FE] text-5xl">
            🚀
          </div>
          <p className="text-xl font-extrabold text-[#0284C7]">Cargando retos espaciales...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <SummaryScreen
        elapsedSeconds={elapsedSeconds}
        correctCount={correctCount}
        score={score}
        onBack={onBack}
        totalQuestions={questions.length}
        subjectTitle="¡Reto Espacial Completado!"
        badgeEmoji="🏆"
      />
    );
  }

  // Evaluación estricta y reactiva de la pregunta actual
  const isCorrect = isAnswered && String(selectedAnswer).trim() === String(currentQuestion.correctAnswer).trim();

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
        <span className="text-3xl">{isCorrect ? "⭐" : "💡"}</span>
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

  return (
    <>
      <ActivityLayout
        onBack={onBack}
        title={lessonData?.title || activityMeta?.title || "Matemáticas - Reto Espacial"}
        icon={activityMeta?.icon || "🚀"}
        counter={<Lives lives={lives} shaking={shakingLife} infinite={Boolean(user?.hasSubscription)} />}
        actionFooter={actionFooter}
      >
        <ProgressBar current={currentIndex + 1} total={questions.length} label={`Reto ${currentIndex + 1} de ${questions.length}`} />

        <section className="mt-4 rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-card">
          <div className="mb-3 text-center">
            <p className="text-sm font-extrabold text-[#0369A1]">
              Reto {currentIndex + 1} de {questions.length}
            </p>
            <h1 className="mt-2 font-heading text-[1.8rem] font-extrabold leading-tight text-slate-800">
              {currentQuestion.question}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">{currentQuestion.helperText}</p>
          </div>

          <div className="grid h-20 sm:h-28 place-items-center rounded-2xl sm:rounded-3xl bg-[#DBF4FF] text-4xl sm:text-6xl" role="img" aria-label="Decoración espacial">
            🚀 ⭐ 🪐
          </div>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isAnswer = isAnswered && String(option).trim() === String(currentQuestion.correctAnswer).trim();

              const stateClass = !isAnswered
                ? "border-[#E2E8F0] bg-white hover:border-[#0284C7]"
                : isAnswer
                ? "border-[#10B981] bg-[#A7F3D0]"
                : isSelected
                ? "border-[#EF4444] bg-[#FECACA]"
                : "border-[#E2E8F0] bg-white opacity-60";

              return (
                <button
                  key={option}
                  type="button"
                  disabled={isAnswered || lives === 0}
                  onClick={() => selectAnswer(option)}
                  className={`flex min-h-[72px] sm:min-h-[86px] items-center justify-between rounded-2xl sm:rounded-3xl border-2 p-2 sm:p-3 shadow-[0_5px_0_rgba(148,163,184,0.12)] transition active:translate-y-0.5 touch-manipulation ${stateClass}`}
                >
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] font-heading font-extrabold text-slate-600 text-xs sm:text-sm">
                    {optionLetters[index]}
                  </span>
                  <span className="flex-1 text-center font-heading text-lg sm:text-2xl md:text-[2rem] font-extrabold truncate px-1">
                    {option}
                  </span>
                  {isAnswered && isAnswer && <span className="text-lg sm:text-xl font-black text-[#047857]">✓</span>}
                  {isAnswered && isSelected && !isAnswer && <span className="text-lg sm:text-xl font-black text-[#EF4444]">×</span>}
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-24" />
      </ActivityLayout>

      {showGameOver && <GameOverModal onRefill={refillLives} onExit={onBack} isPaying={isPaying} error={paymentError} />}
    </>
  );
}
