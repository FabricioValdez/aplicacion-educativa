import { Router } from "express";
import {
  addPointsToClass,
  createClass,
  getClassesForStudent,
  getClassesForTeacher,
  getStudentsInClass,
  joinClassByCode,
} from "../db/class.repository.js";
import { requireUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Listado de clases del usuario actual (docente o alumno)
router.get("/", requireUser, async (request, response, next) => {
  try {
    if (request.user.role === "adult") {
      const classes = await getClassesForTeacher(request.user.id);
      return response.json({ classes });
    }
    const classes = await getClassesForStudent(request.user.id);
    return response.json({ classes });
  } catch (error) {
    return next(error);
  }
});

// Crear una nueva clase (Solo docentes/tutores)
router.post("/", requireUser, async (request, response, next) => {
  try {
    if (request.user.role !== "adult") {
      return response.status(403).json({ message: "Solo los docentes o tutores pueden crear clases." });
    }

    const { name, description, subject } = request.body ?? {};
    if (!name || !name.trim()) {
      return response.status(400).json({ message: "El nombre de la clase es obligatorio." });
    }

    const created = await createClass(request.user.id, { name, description, subject });
    return response.status(201).json({ class: created });
  } catch (error) {
    return next(error);
  }
});

// Unirse a una clase mediante código (Alumnos)
router.post("/join", requireUser, async (request, response, next) => {
  try {
    const { code } = request.body ?? {};
    if (!code || !code.trim()) {
      return response.status(400).json({ message: "Debes ingresar un código de clase." });
    }

    const enrolled = await joinClassByCode(request.user.id, code);
    return response.json({ class: enrolled });
  } catch (error) {
    return next(error);
  }
});

// Sumar puntos a la clase activa del alumno
router.post("/:classId/points", requireUser, async (request, response, next) => {
  try {
    const { classId } = request.params;
    const { points } = request.body ?? {};
    const pts = Number(points) || 0;

    const classPoints = await addPointsToClass(request.user.id, classId, pts);
    return response.json({ success: true, classPoints });
  } catch (error) {
    return next(error);
  }
});

// Ver estudiantes inscritos en una clase (Docente)
router.get("/:classId/students", requireUser, async (request, response, next) => {
  try {
    if (request.user.role !== "adult") {
      return response.status(403).json({ message: "Acceso no autorizado." });
    }

    const students = await getStudentsInClass(request.user.id, request.params.classId);
    return response.json({ students });
  } catch (error) {
    return next(error);
  }
});

export default router;
