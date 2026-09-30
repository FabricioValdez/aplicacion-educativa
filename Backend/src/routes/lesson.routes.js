import { Router } from "express";
import {
  createCustomLesson,
  deleteCustomLesson,
  getLessonExercises,
  getLessonStudentProgress,
  getLessonsForStudent,
  getTeacherLessons,
} from "../db/lesson.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. Obtener listado de lecciones de una materia para un alumno (Práctica + Profesor con >= 10 actividades)
router.get("/subjects/:subject/lessons", requireUser, async (request, response, next) => {
  try {
    const { subject } = request.params;
    const { classId } = request.query;
    const studentId = request.user.id;

    const data = await getLessonsForStudent(studentId, subject, classId || null);
    return response.json(data);
  } catch (error) {
    return next(error);
  }
});

// 2. Obtener una lección específica y sus ejercicios formateados para el juego
router.get("/lessons/:lessonId", requireUser, async (request, response, next) => {
  try {
    const { lessonId } = request.params;
    const { subject = "math" } = request.query;

    const lesson = await getLessonExercises(lessonId, subject);
    return response.json({ lesson });
  } catch (error) {
    return next(error);
  }
});

// 3. Listar lecciones creadas por el docente
router.get("/teachers/:teacherId/lessons", requireUser, async (request, response, next) => {
  try {
    const { teacherId } = request.params;
    const { subject, classId } = request.query;

    if (request.user.id !== teacherId && request.user.role !== "adult") {
      return response.status(403).json({ message: "No autorizado." });
    }

    const lessons = await getTeacherLessons(teacherId, subject || null, classId || null);
    return response.json({ lessons });
  } catch (error) {
    return next(error);
  }
});

// 4. Crear nueva lección (Docente)
router.post("/teachers/:teacherId/lessons", requireUser, async (request, response, next) => {
  try {
    const { teacherId } = request.params;
    if (request.user.id !== teacherId || request.user.role !== "adult") {
      return response.status(403).json({ message: "Solo los docentes pueden crear lecciones." });
    }

    const { classId, subject, title, description } = request.body ?? {};
    if (!title || !title.trim()) {
      return response.status(400).json({ message: "El título de la lección es obligatorio." });
    }

    const lesson = await createCustomLesson(teacherId, {
      classId: classId || null,
      subject: subject || "math",
      title: title.trim(),
      description: description ? description.trim() : "",
    });

    return response.status(201).json({ success: true, lesson });
  } catch (error) {
    return next(error);
  }
});

// 5. Eliminar lección (Docente)
router.delete("/teachers/:teacherId/lessons/:lessonId", requireUser, async (request, response, next) => {
  try {
    const { teacherId, lessonId } = request.params;
    if (request.user.id !== teacherId || request.user.role !== "adult") {
      return response.status(403).json({ message: "No autorizado." });
    }

    const result = await deleteCustomLesson(teacherId, lessonId);
    return response.json(result);
  } catch (error) {
    return next(error);
  }
});

// 6. Monitoreo de alumnos: Ver quiénes completaron y quiénes tienen pendiente una lección
router.get("/teachers/:teacherId/lessons/:lessonId/students", requireUser, async (request, response, next) => {
  try {
    const { teacherId, lessonId } = request.params;
    const { classId } = request.query;

    if (request.user.id !== teacherId || request.user.role !== "adult") {
      return response.status(403).json({ message: "No autorizado." });
    }

    const progress = await getLessonStudentProgress(teacherId, lessonId, classId || null);
    return response.json(progress);
  } catch (error) {
    return next(error);
  }
});

export default router;
