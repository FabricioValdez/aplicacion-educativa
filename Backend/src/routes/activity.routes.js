import { Router } from "express";
import { getActivityById, getAllActivities, getDailyChallenge } from "../db/activity.repository.js";
import { getExercisesBySubject } from "../db/exercise.repository.js";
import { recordLessonProgress } from "../db/user.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Reto diario
router.get("/challenges/daily", requireUser, async (request, response, next) => {
  try {
    const challenge = await getDailyChallenge();
    return response.json({
      challenge: {
        ...challenge,
        completed: request.user.completedChallenges,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/challenges/daily/progress", requireUser, async (request, response, next) => {
  try {
    const challenge = await getDailyChallenge();
    const updatedUser = await recordLessonProgress(request.user.id, null, challenge.total);
    return response.json({ completed: updatedUser.completedChallenges, total: challenge.total });
  } catch (error) {
    return next(error);
  }
});

// Listado de actividades disponibles
router.get("/activities", requireUser, async (_request, response, next) => {
  try {
    const catalog = await getAllActivities();
    return response.json({ activities: catalog });
  } catch (error) {
    return next(error);
  }
});

// Detalle de una actividad específica
router.get("/activities/:activityId", requireUser, async (request, response, next) => {
  try {
    const activity = await getActivityById(request.params.activityId);

    if (!activity) {
      return response.status(404).json({ message: "Actividad no encontrada." });
    }

    const { answer, ...safeActivity } = activity;

    // Asegurar que cada pregunta tenga su correctAnswer para validación pedagógica
    if (Array.isArray(safeActivity.questions)) {
      safeActivity.questions = safeActivity.questions.map((q) => ({
        ...q,
        correctAnswer: q.correctAnswer || answer?.[String(q.id)] || answer?.[Number(q.id)],
      }));
    }

    // Asegurar que cada ejercicio tenga su targetWord y correctOrder
    if (Array.isArray(safeActivity.exercises)) {
      safeActivity.exercises = safeActivity.exercises.map((ex) => ({
        ...ex,
        targetWord: ex.targetWord || (typeof answer?.[String(ex.id)] === "string" ? answer?.[String(ex.id)] : undefined),
        correctOrder: ex.correctOrder || (Array.isArray(answer?.[String(ex.id)]) ? answer?.[String(ex.id)] : undefined),
      }));
    }

    // Incorporar ejercicios personalizados creados por docentes
    const customExs = await getExercisesBySubject(request.params.activityId);
    if (customExs && customExs.length > 0) {
      if (Array.isArray(safeActivity.questions)) {
        const formatted = customExs.map((ce) => ({
          id: `custom_${ce.id}`,
          question: ce.question,
          options: Array.isArray(ce.options) && ce.options.length > 0 ? ce.options : [ce.correctAnswer],
          correctAnswer: ce.correctAnswer,
          explanation: ce.explanation || "Ejercicio asignado por tu profesor",
          points: ce.points || 10,
          isCustom: true,
        }));
        safeActivity.questions = [...safeActivity.questions, ...formatted];
      }
    }

    return response.json({ activity: safeActivity });
  } catch (error) {
    return next(error);
  }
});

// Calificar respuesta de una actividad
router.post("/activities/:activityId/answer", requireUser, async (request, response, next) => {
  try {
    const { activityId } = request.params;
    const activity = await getActivityById(activityId);

    if (!activity) {
      return response.status(404).json({ message: "Actividad no encontrada." });
    }

    // Caso 1: Matemáticas (evaluación por pregunta individual contra answer_json)
    if (activityId === "math") {
      const body = request.body ?? {};
      const rawAnswer = String(body.answer ?? "").trim();
      const questions = Array.isArray(activity.questions) ? activity.questions : [];

      // 1. Identificar la pregunta objetivo por múltiples estrategias
      let targetQuestion = null;

      // Estrategia A: Por questionId o id numérico/string
      const rawQId = body.questionId ?? body.id;

      if (String(rawQId).startsWith("custom_")) {
        const customId = Number(String(rawQId).replace("custom_", ""));
        const customExs = await getExercisesBySubject("math");
        const ce = customExs.find((e) => e.id === customId);
        if (ce) {
          const isCorrect = rawAnswer.toLowerCase() === String(ce.correctAnswer).trim().toLowerCase();
          const pointsToAward = isCorrect ? (ce.points || 10) : 0;
          return response.json({
            questionId: rawQId,
            correct: isCorrect,
            correctAnswer: String(ce.correctAnswer).trim(),
            explanation: ce.explanation || "",
            points: pointsToAward,
            newTotalPoints: request.user.points,
            completedChallenges: request.user.completedChallenges,
            message: isCorrect ? "¡Respuesta correcta! (Ejercicio del profesor) 🎉" : "Casi lo logras. ¡Sigue intentando!",
          });
        }
      }

      if (rawQId !== undefined && rawQId !== null && rawQId !== "" && !Number.isNaN(Number(rawQId))) {
        targetQuestion = questions.find(
          (q) => Number(q.id) === Number(rawQId) || String(q.id) === String(rawQId)
        );
      }

      // Estrategia B: Por questionText
      if (!targetQuestion && body.questionText) {
        const searchText = String(body.questionText).trim().toLowerCase();
        targetQuestion = questions.find(
          (q) => q.question && String(q.question).trim().toLowerCase() === searchText
        );
      }

      // Estrategia C: Por índice (0-indexed o 1-indexed)
      if (!targetQuestion) {
        const rawIndex = body.currentIndex ?? body.index ?? body.questionIndex;
        if (rawIndex !== undefined && rawIndex !== null && rawIndex !== "") {
          const idx = Number(rawIndex);
          if (!Number.isNaN(idx)) {
            if (idx >= 0 && idx < questions.length) {
              targetQuestion = questions[idx];
            } else if (idx >= 1 && idx <= questions.length) {
              targetQuestion = questions[idx - 1];
            }
          }
        }
      }

      // Estrategia D: Por opciones coincidentes con la respuesta enviada
      if (!targetQuestion && rawAnswer) {
        const matchingQuestions = questions.filter(
          (q) => Array.isArray(q.options) && q.options.some((opt) => String(opt).trim() === rawAnswer)
        );
        if (matchingQuestions.length > 0) {
          targetQuestion = matchingQuestions[0];
        }
      }

      // Estrategia E: Fallback de seguridad al primer reto si hay preguntas en el catálogo
      if (!targetQuestion && questions.length > 0) {
        targetQuestion = questions[0];
      }

      if (!targetQuestion) {
        return response.status(400).json({ message: "No se pudo identificar la pregunta a calificar." });
      }

      const qId = targetQuestion.id;
      const targetAnswer = activity.answer?.[String(qId)] ?? activity.answer?.[Number(qId)];

      if (targetAnswer === undefined) {
        return response.status(400).json({ message: "Respuesta no configurada para esta pregunta." });
      }

      const explanation = targetQuestion.explanation || "";
      const isCorrect = rawAnswer === String(targetAnswer).trim();
      const pointsToAward = isCorrect ? (targetQuestion.points || 10) : 0;

      return response.json({
        questionId: qId,
        correct: isCorrect,
        correctAnswer: String(targetAnswer).trim(),
        explanation,
        points: pointsToAward,
        newTotalPoints: request.user.points,
        completedChallenges: request.user.completedChallenges,
        message: isCorrect ? "¡Respuesta correcta!" : "Casi lo logras. ¡Sigue intentando!",
      });
    }

    // Caso 2: Ciencias (ordenamiento del ciclo de 10 ejercicios)
    if (activityId === "science") {
      const body = request.body ?? {};
      const submittedOrder = body.answer ?? body.order;
      const exercises = Array.isArray(activity.exercises) ? activity.exercises : [];

      let targetExercise = null;
      const rawExId = body.exerciseId ?? body.id;
      if (rawExId !== undefined && rawExId !== null && rawExId !== "") {
        targetExercise = exercises.find(
          (e) => Number(e.id) === Number(rawExId) || String(e.id) === String(rawExId)
        );
      }

      if (!targetExercise) {
        const rawIndex = body.currentIndex ?? body.index;
        if (rawIndex !== undefined && rawIndex !== null && rawIndex !== "") {
          const idx = Number(rawIndex);
          if (!Number.isNaN(idx)) {
            if (idx >= 0 && idx < exercises.length) {
              targetExercise = exercises[idx];
            } else if (idx >= 1 && idx <= exercises.length) {
              targetExercise = exercises[idx - 1];
            }
          }
        }
      }

      if (!targetExercise && exercises.length > 0) {
        targetExercise = exercises[0];
      }

      if (!targetExercise) {
        return response.status(400).json({ message: "No se pudo identificar el ejercicio de ciencias." });
      }

      const exId = targetExercise.id;
      const targetOrder = activity.answer?.[String(exId)] ?? activity.answer?.[Number(exId)] ?? targetExercise.correctOrder;

      const isCorrect = Array.isArray(submittedOrder) && Array.isArray(targetOrder) &&
        submittedOrder.length === targetOrder.length &&
        submittedOrder.every((val, i) => String(val) === String(targetOrder[i]));

      const pointsToAward = isCorrect ? (targetExercise.points || 10) : 0;

      return response.json({
        exerciseId: exId,
        correct: isCorrect,
        correctOrder: targetOrder,
        explanation: targetExercise.explanation || "",
        points: pointsToAward,
        newTotalPoints: request.user.points,
        completedChallenges: request.user.completedChallenges,
        message: isCorrect
          ? "¡Proceso natural ordenado a la perfección! ✨"
          : "El orden aún no es correcto. ¡Revisa la secuencia y prueba otra vez!",
      });
    }

    // Caso 3: Español (Reto de palabras de 10 ejercicios)
    if (activityId === "spanish") {
      const body = request.body ?? {};
      const submittedWord = String(body.answer ?? "").toUpperCase().trim();
      const exercises = Array.isArray(activity.exercises) ? activity.exercises : [];

      let targetExercise = null;
      const rawExId = body.exerciseId ?? body.id;
      if (rawExId !== undefined && rawExId !== null && rawExId !== "") {
        targetExercise = exercises.find(
          (e) => Number(e.id) === Number(rawExId) || String(e.id) === String(rawExId)
        );
      }

      if (!targetExercise) {
        const rawIndex = body.currentIndex ?? body.index;
        if (rawIndex !== undefined && rawIndex !== null && rawIndex !== "") {
          const idx = Number(rawIndex);
          if (!Number.isNaN(idx)) {
            if (idx >= 0 && idx < exercises.length) {
              targetExercise = exercises[idx];
            } else if (idx >= 1 && idx <= exercises.length) {
              targetExercise = exercises[idx - 1];
            }
          }
        }
      }

      if (!targetExercise && exercises.length > 0) {
        targetExercise = exercises[0];
      }

      if (!targetExercise) {
        return response.status(400).json({ message: "No se pudo identificar el ejercicio de español." });
      }

      const exId = targetExercise.id;
      const targetWord = String(
        activity.answer?.[String(exId)] ?? activity.answer?.[Number(exId)] ?? targetExercise.targetWord ?? ""
      ).toUpperCase().trim();

      const isCorrect = submittedWord === targetWord;
      const pointsToAward = isCorrect ? (targetExercise.points || 10) : 0;

      return response.json({
        exerciseId: exId,
        correct: isCorrect,
        correctAnswer: targetWord,
        explanation: targetExercise.explanation || "",
        points: pointsToAward,
        newTotalPoints: request.user.points,
        completedChallenges: request.user.completedChallenges,
        message: isCorrect
          ? "¡Palabra correcta! ¡Excelente trabajo! 📖✨"
          : `Esa no es la palabra correcta. La respuesta era ${targetWord}.`,
      });
    }

    // Caso 4: Geografía (Trivia de 10 preguntas)
    if (activityId === "geography") {
      const body = request.body ?? {};
      const rawAnswer = String(body.answer ?? "").trim();
      const questions = Array.isArray(activity.questions) ? activity.questions : [];

      let targetQuestion = null;
      const rawQId = body.questionId ?? body.id;

      if (String(rawQId).startsWith("custom_")) {
        const customId = Number(String(rawQId).replace("custom_", ""));
        const customExs = await getExercisesBySubject("geography");
        const ce = customExs.find((e) => e.id === customId);
        if (ce) {
          const isCorrect = rawAnswer.toLowerCase() === String(ce.correctAnswer).trim().toLowerCase();
          const pointsToAward = isCorrect ? (ce.points || 10) : 0;
          return response.json({
            questionId: rawQId,
            correct: isCorrect,
            correctAnswer: String(ce.correctAnswer).trim(),
            explanation: ce.explanation || "",
            points: pointsToAward,
            newTotalPoints: request.user.points,
            completedChallenges: request.user.completedChallenges,
            message: isCorrect ? "¡Correcto! ¡Gran conocimiento explorador! 🌍✨" : `¡Casi lo logras! La respuesta correcta era ${ce.correctAnswer}.`,
          });
        }
      }

      if (rawQId !== undefined && rawQId !== null && rawQId !== "") {
        targetQuestion = questions.find(
          (q) => Number(q.id) === Number(rawQId) || String(q.id) === String(rawQId)
        );
      }

      if (!targetQuestion && body.questionText) {
        const searchText = String(body.questionText).trim().toLowerCase();
        targetQuestion = questions.find(
          (q) => q.question && String(q.question).trim().toLowerCase() === searchText
        );
      }

      if (!targetQuestion) {
        const rawIndex = body.currentIndex ?? body.index ?? body.questionIndex;
        if (rawIndex !== undefined && rawIndex !== null && rawIndex !== "") {
          const idx = Number(rawIndex);
          if (!Number.isNaN(idx)) {
            if (idx >= 0 && idx < questions.length) {
              targetQuestion = questions[idx];
            } else if (idx >= 1 && idx <= questions.length) {
              targetQuestion = questions[idx - 1];
            }
          }
        }
      }

      if (!targetQuestion && rawAnswer) {
        const matchingQuestions = questions.filter(
          (q) => Array.isArray(q.options) && q.options.some((opt) => String(opt).trim().toLowerCase() === rawAnswer.toLowerCase())
        );
        if (matchingQuestions.length > 0) {
          targetQuestion = matchingQuestions[0];
        }
      }

      if (!targetQuestion && questions.length > 0) {
        targetQuestion = questions[0];
      }

      if (!targetQuestion) {
        return response.status(400).json({ message: "No se pudo identificar la pregunta de geografía." });
      }

      const qId = targetQuestion.id;
      const targetAnswer = String(
        activity.answer?.[String(qId)] ?? activity.answer?.[Number(qId)] ?? targetQuestion.correctAnswer ?? ""
      ).trim();

      const isCorrect = rawAnswer.toLowerCase() === targetAnswer.toLowerCase();
      const pointsToAward = isCorrect ? (targetQuestion.points || 10) : 0;

      return response.json({
        questionId: qId,
        correct: isCorrect,
        correctAnswer: targetAnswer,
        explanation: targetQuestion.explanation || "",
        points: pointsToAward,
        newTotalPoints: request.user.points,
        completedChallenges: request.user.completedChallenges,
        message: isCorrect
          ? "¡Correcto! ¡Gran conocimiento explorador! 🌍✨"
          : `¡Casi lo logras! La respuesta correcta era ${targetAnswer}.`,
      });
    }

    return response.status(400).json({ message: "Tipo de actividad no soportado." });
  } catch (error) {
    return next(error);
  }
});

export default router;
