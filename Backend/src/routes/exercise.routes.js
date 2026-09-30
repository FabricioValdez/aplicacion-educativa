import { Router } from "express";
import {
  createCustomExercise,
  deleteCustomExercise,
  getExercisesBySubject,
  getExercisesByTeacher,
} from "../db/exercise.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Obtener ejercicios
router.get("/", requireUser, async (request, response, next) => {
  try {
    const { subject, classId } = request.query;

    if (request.user.role === "adult" && !subject) {
      // El profesor ve todos los ejercicios que ha creado
      const exercises = await getExercisesByTeacher(request.user.id);
      return response.json({ exercises });
    }

    // Alumnos o consulta por materia específica
    const exercises = await getExercisesBySubject(subject || "math", classId || null);
    return response.json({ exercises });
  } catch (error) {
    return next(error);
  }
});

// Crear nuevo ejercicio (Docentes)
const handleCreateExercise = async (request, response, next) => {
  try {
    if (request.user.role !== "adult") {
      return response.status(403).json({ message: "Solo los docentes pueden crear ejercicios." });
    }

    const {
      classId,
      lessonId,
      subject = "math",
      title,
      question,
      options,
      correctAnswer,
      explanation,
      points,
      dataJson,
    } = request.body ?? {};

    const cleanQuestion = String(question || dataJson?.clue || dataJson?.instruction || "").trim();
    if (!cleanQuestion) {
      return response.status(400).json({ message: "La pregunta o instrucción es requerida." });
    }

    const cleanCorrectAnswer = String(
      correctAnswer || dataJson?.targetWord || (dataJson?.correctOrder ? dataJson.correctOrder.join(",") : "") || ""
    ).trim();

    if (!cleanCorrectAnswer && subject !== "science") {
      return response.status(400).json({ message: "La respuesta correcta o palabra secreta es requerida." });
    }

    const exercise = await createCustomExercise(request.user.id, {
      classId,
      lessonId,
      subject,
      title,
      question: cleanQuestion,
      options: Array.isArray(options) ? options : [],
      correctAnswer: cleanCorrectAnswer || "secuencia",
      explanation,
      points: Number(points) || 10,
      dataJson,
    });

    return response.status(201).json({ success: true, exercise });
  } catch (error) {
    return next(error);
  }
};

router.post("/", requireUser, handleCreateExercise);
router.post("/teachers/:teacherId/exercises", requireUser, handleCreateExercise);

// Eliminar ejercicio
router.delete("/:id", requireUser, async (request, response, next) => {
  try {
    if (request.user.role !== "adult") {
      return response.status(403).json({ message: "No autorizado." });
    }

    const success = await deleteCustomExercise(request.params.id, request.user.id);
    if (!success) {
      return response.status(404).json({ message: "Ejercicio no encontrado o no pertenece a tu cuenta." });
    }

    return response.json({ success: true, message: "Ejercicio eliminado correctamente." });
  } catch (error) {
    return next(error);
  }
});

export default router;
