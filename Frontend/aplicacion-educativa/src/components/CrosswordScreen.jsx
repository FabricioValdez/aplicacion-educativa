import { useEffect, useState, useCallback } from "react";
import { getActivity, submitActivityAnswer } from "../api";
import { useUser } from "../context/useUser";
import { defaultSpanishExercises } from "../data/lessonsData";
import ActivityLayout from "./ActivityLayout";
import ProgressBar from "./common/ProgressBar";
import { Lives, GameOverModal, SummaryScreen } from "./common/GameModals";

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const typeLabels = {
  adivinanza: "Adivinanza Misteriosa 🧩",
  sinonimo: "Sinónimos Parecidos 🔄",
  antonimo: "Antónimos Opuestos ⚡",
};

export default function CrosswordScreen({
  onBack = () => {},
  onComplete = async () => {},
  onRefill = async () => {},
  lessonData = null,
}) {
  const { user, addPoints } = useUser();

  const [exercises, setExercises] = useState(() => {
    if (Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0) {
      return lessonData.exercises;
    }
    return defaultSpanishExercises;
  });
  const [activityMeta, setActivityMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [blankAnswers, setBlankAnswers] = useState({}); // { [blankIndex]: "A" }
  const [activeBlankIdx, setActiveBlankIdx] = useState(0);

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
      setExercises(lessonData.exercises);
      return;
    }

    if (!user?.id) return;
    let isCurrent = true;

    getActivity(user.id, "spanish")
      .then((data) => {
        if (!isCurrent) return;
        const fetchedActivity = data.activity;
        setActivityMeta(fetchedActivity);
        if (Array.isArray(fetchedActivity?.exercises) && fetchedActivity.exercises.length > 0) {
          setExercises(
            fetchedActivity.exercises.map((ex, idx) => ({
              ...defaultSpanishExercises[idx],
              ...ex,
              targetWord: ex.targetWord || defaultSpanishExercises[idx]?.targetWord,
              explanation: ex.explanation || defaultSpanishExercises[idx]?.explanation,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Usando catálogo local de español:", err);
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

  // Ejercicio actual reactivo
  const currentExercise = exercises[currentIndex] || defaultSpanishExercises[currentIndex] || defaultSpanishExercises[0];
  const displayPattern = currentExercise?.displayPattern || [];

  // Mapear los índices de casillas vacías ("_")
  const blankSlots = displayPattern
    .map((char, index) => (char === "_" ? index : null))
    .filter((idx) => idx !== null);

  // Construir la palabra final armada reactivamente
  const constructedWord = displayPattern
    .map((char, index) => {
      if (char !== "_") return char;
      const blankIndex = blankSlots.indexOf(index);
      return blankAnswers[blankIndex] || "";
    })
    .join("");

  const allBlanksFilled =
    blankSlots.length > 0 &&
    blankSlots.every((_, idx) => Boolean(blankAnswers[idx] && blankAnswers[idx].trim()));

  // Manejar adición de letra
  const addLetter = useCallback(
    (letter) => {
      if (isAnswered || lives === 0) return;
      const upper = letter.toUpperCase();

      setBlankAnswers((prev) => ({ ...prev, [activeBlankIdx]: upper }));

      // Mover automáticamente al siguiente espacio vacío si no es el último
      if (activeBlankIdx < blankSlots.length - 1) {
        setActiveBlankIdx((prev) => prev + 1);
      }
    },
    [isAnswered, lives, activeBlankIdx, blankSlots.length]
  );

  // Borrar letra
  const removeLetter = useCallback(() => {
    if (isAnswered || lives === 0) return;

    setBlankAnswers((prev) => {
      if (prev[activeBlankIdx]) {
        const next = { ...prev };
        delete next[activeBlankIdx];
        return next;
      } else if (activeBlankIdx > 0) {
        const prevIdx = activeBlankIdx - 1;
        setActiveBlankIdx(prevIdx);
        const next = { ...prev };
        delete next[prevIdx];
        return next;
      }
      return prev;
    });
  }, [isAnswered, lives, activeBlankIdx]);

  // Enviar y validar palabra contra currentExercise
  const submitWord = async () => {
    if (isAnswered || lives === 0 || !currentExercise || !allBlanksFilled) return;

    setSelectedAnswer(constructedWord);
    setIsAnswered(true);

    // Comparación 100% pura y local con currentExercise.targetWord
    const isCorrect = constructedWord.toUpperCase().trim() === String(currentExercise.targetWord).toUpperCase().trim();

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
    submitActivityAnswer(user?.id, "spanish", {
      exerciseId: currentExercise.id,
      id: currentExercise.id,
      currentIndex,
      answer: constructedWord,
    }).catch(() => {});
  };

  // Soporte para teclado físico
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isAnswered || lives === 0) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        removeLetter();
      } else if (e.key === "Enter" && allBlanksFilled) {
        e.preventDefault();
        submitWord();
      } else if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚ]$/.test(e.key)) {
        e.preventDefault();
        addLetter(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, lives, allBlanksFilled, addLetter, removeLetter]);

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
        await addPoints(score, "spanish_completion");
      } catch (err) {
        console.error("Error al sumar puntos acumulados:", err);
      }
    }
    if (onComplete) {
      setIsSaving(true);
      try {
        const lessonKey = lessonData?.isDefault
          ? "espanol"
          : (lessonData?.id ? (String(lessonData.id).startsWith("lesson_") ? lessonData.id : `lesson_${lessonData.id}`) : "espanol");

        await onComplete({
          pointsEarned: score,
          completedLesson: lessonKey,
          elapsedSeconds,
          correctCount,
        });
      } catch (err) {
        console.error("Error al registrar fin de lección:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const nextExercise = () => {
    if (currentIndex >= exercises.length - 1) {
      handleFinish();
      return;
    }

    // Limpiar completamente el estado de la respuesta anterior
    setCurrentIndex((val) => val + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setBlankAnswers({});
    setActiveBlankIdx(0);
  };

  if (isComplete) {
    return (
      <SummaryScreen
        elapsedSeconds={elapsedSeconds}
        correctCount={correctCount}
        score={score}
        onBack={onBack}
        totalQuestions={exercises.length}
        subjectTitle="¡Maestro de las Palabras!"
        badgeEmoji="📖"
      />
    );
  }

  // Evaluación estricta y reactiva de la palabra actual
  const isCorrect = isAnswered && constructedWord.toUpperCase().trim() === String(currentExercise?.targetWord).toUpperCase().trim();

  const feedback = isCorrect
    ? "¡Excelente! " + currentExercise.explanation
    : "¡Casi! La palabra correcta era: " + currentExercise.targetWord + ". " + currentExercise.explanation;

  const actionFooter = isAnswered ? (
    <div
      className={`rounded-3xl border-2 p-4 transition-all duration-300 shadow-[0_4px_0_rgba(0,0,0,0.05)] ${
        isCorrect ? "border-[#86EFAC] bg-[#DCFCE7]" : "border-[#FCA5A5] bg-[#FEF2F2]"
      }`}
    >
      <div className="flex items-start gap-3 text-left">
        <span className="text-3xl">{isCorrect ? "🌟" : "💡"}</span>
        <div className="flex-1">
          <p className="font-heading text-base font-extrabold text-slate-800">{feedback}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={currentIndex === exercises.length - 1 ? handleFinish : nextExercise}
        disabled={isSaving}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#0284C7] px-5 font-heading text-lg font-extrabold text-white shadow-button transition active:scale-95 disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : currentIndex === exercises.length - 1 ? "Ver Resultados 🏆" : "Siguiente Reto ➔"}
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      {/* Botones de acción rápida: Borrar y Comprobar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={removeLetter}
          aria-label="Borrar letra"
          className="flex h-11 sm:h-12 flex-1 items-center justify-center rounded-2xl border-2 border-[#FCA5A5] bg-[#FEE2E2] font-heading font-extrabold text-[#DC2626] shadow-[0_3px_0_#F87171] active:translate-y-[2px] touch-manipulation"
        >
          <span className="text-lg sm:text-xl">⌫</span>
          <span className="ml-1 text-xs sm:text-sm">Borrar</span>
        </button>

        <button
          type="button"
          onClick={submitWord}
          disabled={!allBlanksFilled}
          className="flex h-11 sm:h-12 flex-[2] items-center justify-center rounded-2xl border-2 border-[#059669] bg-[#10B981] font-heading text-sm sm:text-base font-extrabold text-white shadow-[0_4px_0_#047857] active:translate-y-[2px] disabled:opacity-50 touch-manipulation"
        >
          Comprobar Palabra ✓
        </button>
      </div>

      {/* Teclado Virtual para niños */}
      <div className="rounded-3xl border-2 border-[#E2E8F0] bg-[#F8FAFC] p-1.5 sm:p-2.5 shadow-inner">
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="mb-1 sm:mb-1.5 flex justify-center gap-0.5 sm:gap-1.5 last:mb-0">
            {row.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => addLetter(letter)}
                disabled={isAnswered}
                className="flex h-10 sm:h-12 min-w-0 flex-1 max-w-[2.25rem] sm:max-w-[2.75rem] items-center justify-center rounded-xl border-2 border-[#CBD5E1] bg-white font-heading text-xs sm:text-base font-extrabold text-slate-700 shadow-[0_2px_0_#94A3B8] transition active:translate-y-[1px] hover:border-[#0284C7] hover:text-[#0284C7] disabled:opacity-40 touch-manipulation"
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <ActivityLayout
        onBack={onBack}
        title={lessonData?.title || activityMeta?.title || "Palabras Mágicas"}
        icon={activityMeta?.icon || "📖"}
        counter={<Lives lives={lives} shaking={shakingLife} infinite={Boolean(user?.hasSubscription)} />}
        actionFooter={actionFooter}
      >
        <ProgressBar current={currentIndex + 1} total={exercises.length} label={`Palabra ${currentIndex + 1} de ${exercises.length}`} />

        <section className="mt-4 rounded-3xl border-2 border-[#E2E8F0] bg-white p-5 text-center shadow-card">
          <div className="inline-block rounded-full bg-[#FEF3C7] px-3 py-1 font-heading text-xs font-extrabold text-[#B45309]">
            {typeLabels[currentExercise.type] || "Reto de Palabras ✨"}
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-4xl" role="img" aria-label="Pista visual">
              {currentExercise.clueEmoji || "🔍"}
            </span>
            <h1 className="font-heading text-xl font-extrabold leading-tight text-slate-800">
              "{currentExercise.clue}"
            </h1>
          </div>

          {currentExercise.helperText && (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              💡 {currentExercise.helperText}
            </p>
          )}

          {/* Casillas de la palabra interactiva */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2" role="region" aria-label="Casillas de letras">
            {displayPattern.map((char, index) => {
              const isBlank = char === "_";
              const blankIndex = isBlank ? blankSlots.indexOf(index) : -1;
              const filledLetter = isBlank ? blankAnswers[blankIndex] : char;
              const isActiveBlank = isBlank && blankIndex === activeBlankIdx && !isAnswered;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={!isBlank || isAnswered}
                  onClick={() => {
                    if (isBlank && !isAnswered) {
                      setActiveBlankIdx(blankIndex);
                    }
                  }}
                  className={`flex h-12 w-10 sm:h-16 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl border-2 font-heading text-xl sm:text-2xl font-extrabold transition-all duration-200 touch-manipulation ${
                    !isBlank
                      ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] cursor-default shadow-[0_3px_0_#93C5FD]"
                      : isActiveBlank
                      ? "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309] shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105"
                      : filledLetter
                      ? "border-[#10B981] bg-[#ECFDF5] text-[#047857] shadow-[0_3px_0_#6EE7B7]"
                      : "border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-transparent hover:border-[#0284C7]"
                  }`}
                  aria-label={isBlank ? `Casilla vacía ${blankIndex + 1}` : `Letra fija ${char}`}
                >
                  {filledLetter || "•"}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs font-bold text-slate-400">
            Toca las casillas punteadas o escribe las letras faltantes.
          </p>
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
