import { useEffect, useState } from "react";
import { getActivity, submitActivityAnswer } from "../api";
import { useUser } from "../context/useUser";
import { defaultScienceExercises } from "../data/lessonsData";
import ActivityLayout from "./ActivityLayout";
import ProgressBar from "./common/ProgressBar";
import { Lives, GameOverModal, SummaryScreen } from "./common/GameModals";

// Función auxiliar para barajar elementos de forma no idéntica
function shuffleItems(items = []) {
  if (!items || items.length <= 1) return [...items];
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  // Si por azar quedó idéntico al original, forzar un intercambio
  const isIdentical = list.every((item, idx) => item.id === items[idx].id);
  if (isIdentical && list.length > 1) {
    [list[0], list[1]] = [list[1], list[0]];
  }
  return list;
}

export default function PlantCycleScreen({
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
    return defaultScienceExercises;
  });
  const [activityMeta, setActivityMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOrder, setCurrentOrder] = useState(() => {
    const initialList = Array.isArray(lessonData?.exercises) && lessonData.exercises.length > 0
      ? lessonData.exercises[0]?.items
      : defaultScienceExercises[0]?.items;
    return shuffleItems(initialList);
  });
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrectState, setIsCorrectState] = useState(false);

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

    getActivity(user.id, "science")
      .then((data) => {
        if (!isCurrent) return;
        const fetchedActivity = data.activity;
        setActivityMeta(fetchedActivity);
        if (Array.isArray(fetchedActivity?.exercises) && fetchedActivity.exercises.length > 0) {
          setExercises(
            fetchedActivity.exercises.map((ex, idx) => ({
              ...defaultScienceExercises[idx],
              ...ex,
              correctOrder: ex.correctOrder || defaultScienceExercises[idx]?.correctOrder,
              explanation: ex.explanation || defaultScienceExercises[idx]?.explanation,
            }))
          );
        }
      })
      .catch((err) => {
        console.warn("Usando catálogo local de ciencias:", err);
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
  const currentExercise = exercises[currentIndex] || defaultScienceExercises[currentIndex] || defaultScienceExercises[0];

  // Configurar items desordenados al cambiar de ejercicio
  useEffect(() => {
    if (currentExercise?.items) {
      setCurrentOrder(shuffleItems(currentExercise.items));
      setSelectedCardId(null);
      setIsAnswered(false);
      setIsCorrectState(false);
    }
  }, [currentIndex, currentExercise]);

  // Mecánica 1: Tap-to-swap
  const handleCardClick = (id) => {
    if (isAnswered || lives === 0) return;

    if (!selectedCardId) {
      setSelectedCardId(id);
      return;
    }

    if (selectedCardId === id) {
      setSelectedCardId(null);
      return;
    }

    // Intercambiar
    setCurrentOrder((prev) => {
      const next = [...prev];
      const idxA = next.findIndex((item) => item.id === selectedCardId);
      const idxB = next.findIndex((item) => item.id === id);
      if (idxA !== -1 && idxB !== -1) {
        [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      }
      return next;
    });
    setSelectedCardId(null);
  };

  // Mecánica 2: Mover arriba o abajo directamente
  const moveItem = (index, direction) => {
    if (isAnswered || lives === 0) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    setCurrentOrder((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setSelectedCardId(null);
  };

  // Enviar y comprobar orden contra currentExercise
  const checkOrder = async () => {
    if (isAnswered || lives === 0 || !currentExercise) return;

    setIsAnswered(true);

    const submittedOrderIds = currentOrder.map((item) => item.id);
    const targetOrder = currentExercise.correctOrder || [];

    // Validación 100% pura y local
    const isCorrect =
      Array.isArray(targetOrder) &&
      submittedOrderIds.length === targetOrder.length &&
      submittedOrderIds.every((id, idx) => id === targetOrder[idx]);

    setIsCorrectState(isCorrect);

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
    submitActivityAnswer(user?.id, "science", {
      exerciseId: currentExercise.id,
      id: currentExercise.id,
      currentIndex,
      answer: submittedOrderIds,
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
        await addPoints(score, "science_completion");
      } catch (err) {
        console.error("Error al sumar puntos acumulados:", err);
      }
    }
    if (onComplete) {
      setIsSaving(true);
      try {
        const lessonKey = lessonData?.isDefault
          ? "ciencias"
          : (lessonData?.id ? (String(lessonData.id).startsWith("lesson_") ? lessonData.id : `lesson_${lessonData.id}`) : "ciencias");

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
    setSelectedCardId(null);
    setIsAnswered(false);
    setIsCorrectState(false);
  };

  if (isComplete) {
    return (
      <SummaryScreen
        elapsedSeconds={elapsedSeconds}
        correctCount={correctCount}
        score={score}
        onBack={onBack}
        totalQuestions={exercises.length}
        subjectTitle="¡Pequeño Gran Científico!"
        badgeEmoji="🌱"
      />
    );
  }

  const feedback = isCorrectState
    ? "¡Excelente! " + currentExercise.explanation
    : "¡Casi! Revisa el orden de los pasos. " + currentExercise.explanation;

  const actionFooter = isAnswered ? (
    <div
      className={`rounded-3xl border-2 p-4 transition-all duration-300 shadow-[0_4px_0_rgba(0,0,0,0.05)] ${
        isCorrectState ? "border-[#86EFAC] bg-[#DCFCE7]" : "border-[#FCA5A5] bg-[#FEF2F2]"
      }`}
    >
      <div className="flex items-start gap-3 text-left">
        <span className="text-3xl">{isCorrectState ? "🌿" : "💡"}</span>
        <div className="flex-1">
          <p className="font-heading text-base font-extrabold text-slate-800">{feedback}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={currentIndex === exercises.length - 1 ? handleFinish : nextExercise}
        disabled={isSaving}
        className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#059669] px-5 font-heading text-lg font-extrabold text-white shadow-button transition active:scale-95 disabled:opacity-60"
      >
        {isSaving ? "Guardando..." : currentIndex === exercises.length - 1 ? "Ver Resultados 🏆" : "Siguiente Proceso ➔"}
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-2xl border border-[#CFE0FF] bg-[#EAF2FF] p-3 text-slate-700">
        <span className="text-3xl">🧑‍🌾</span>
        <p className="text-xs font-bold leading-relaxed text-[#0369A1]">
          {selectedCardId
            ? "¡Genial! Ahora toca otra tarjeta para intercambiar sus lugares."
            : "Toca una tarjeta para seleccionarla y luego otra para cambiarla, o usa las flechas ▲ ▼."}
        </p>
      </div>

      <button
        type="button"
        onClick={checkOrder}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-[#008B67] px-5 font-heading text-lg font-extrabold text-white shadow-[0_5px_0_#00634B] transition active:translate-y-[2px]"
      >
        Comprobar Secuencia ✨
      </button>
    </div>
  );

  return (
    <>
      <ActivityLayout
        onBack={onBack}
        title={lessonData?.title || activityMeta?.title || "Ciencias Naturales"}
        icon={activityMeta?.icon || "🌱"}
        counter={<Lives lives={lives} shaking={shakingLife} infinite={Boolean(user?.hasSubscription)} />}
        actionFooter={actionFooter}
      >
        <ProgressBar
          current={currentIndex + 1}
          total={exercises.length}
          label={`Proceso ${currentIndex + 1} de ${exercises.length}`}
        />

        {/* Encabezado del reto de ciencias */}
        <section className="mt-4 rounded-3xl border-2 border-[#DCE8F5] bg-white p-4 text-center shadow-card">
          <div className="inline-block rounded-full bg-[#DCFCE7] px-3 py-1 font-heading text-xs font-extrabold text-[#047857]">
            {currentExercise.icon || "🌱"} Proceso Natural
          </div>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-slate-800">
            {currentExercise.title}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {currentExercise.instruction}
          </p>

          {/* Vista previa en miniatura de la línea de tiempo */}
          <div className="mt-4 flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-2">
            {currentOrder.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border-2 border-[#A7F3D0] bg-[#ECFDF5] text-xl sm:text-2xl shadow-sm">
                  {item.emoji}
                </div>
                {idx < currentOrder.length - 1 && (
                  <span className="text-slate-400 font-bold text-sm">➔</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tarjetas interactivas de reordenamiento */}
        <section className="mt-4 space-y-2.5" role="list" aria-label="Tarjetas de pasos para ordenar">
          {currentOrder.map((item, index) => {
            const isSelected = selectedCardId === item.id;

            return (
              <div
                key={item.id}
                role="listitem"
                className={`relative flex items-center gap-3 rounded-2xl border-2 p-3 transition-all duration-200 ${
                  isSelected
                    ? "border-[#F59E0B] bg-[#FFFBEB] shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-[1.02]"
                    : isAnswered && isCorrectState
                    ? "border-[#10B981] bg-[#ECFDF5]"
                    : isAnswered && !isCorrectState
                    ? "border-[#FCA5A5] bg-[#FEF2F2]"
                    : "border-[#E2E8F0] bg-white shadow-card hover:border-[#0284C7]"
                }`}
              >
                {/* Botón principal para seleccionar y cambiar */}
                <button
                  type="button"
                  onClick={() => handleCardClick(item.id)}
                  disabled={isAnswered}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#008B67] font-heading font-extrabold text-white text-base shadow-sm">
                    {index + 1}
                  </span>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-3xl">
                    {item.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-base font-extrabold text-slate-800 truncate">
                      {item.label}
                    </span>
                    {isSelected && (
                      <span className="inline-block mt-0.5 rounded-full bg-[#FDE68A] px-2 py-0.5 text-[10px] font-extrabold text-[#92400E]">
                        ⭐ Seleccionado
                      </span>
                    )}
                  </span>
                </button>

                {/* Flechas directas de mover arriba / abajo */}
                {!isAnswered && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                      className="flex h-8 w-9 sm:h-9 sm:w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-[#E2E8F0] disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                      aria-label={`Mover ${item.label} arriba`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === currentOrder.length - 1}
                      onClick={() => moveItem(index, 1)}
                      className="flex h-8 w-9 sm:h-9 sm:w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-[#E2E8F0] disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                      aria-label={`Mover ${item.label} abajo`}
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
