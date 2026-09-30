import { pool } from "../config/database.js";

// Mapeador de materias normalizado
const SUBJECT_MAP = {
  matematicas: "math",
  math: "math",
  espanol: "spanish",
  spanish: "spanish",
  ciencias: "science",
  science: "science",
  geografia: "geography",
  geography: "geography",
};

export async function createCustomLesson(teacherId, { classId = null, subject = "math", title, description = "" }) {
  const cleanTitle = String(title || "").trim();
  const cleanSubject = SUBJECT_MAP[subject] || "math";

  if (!cleanTitle || cleanTitle.length < 2) {
    throw new Error("El título de la lección debe tener al menos 2 caracteres.");
  }

  const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await pool.query(
    `INSERT INTO custom_lessons (id, teacher_id, class_id, subject, title, description, min_activities)
     VALUES (?, ?, ?, ?, ?, ?, 10);`,
    [lessonId, teacherId, classId || null, cleanSubject, cleanTitle, description || null]
  );

  const [rows] = await pool.query("SELECT * FROM custom_lessons WHERE id = ?", [lessonId]);
  return {
    ...rows[0],
    activityCount: 0,
    isPlayable: false,
  };
}

export async function getTeacherLessons(teacherId, subject = null, classId = null) {
  let query = `
    SELECT cl.*, c.name AS class_name,
      COUNT(ce.id) AS activity_count
    FROM custom_lessons cl
    LEFT JOIN classes c ON cl.class_id = c.id
    LEFT JOIN custom_exercises ce ON ce.lesson_id = cl.id
    WHERE cl.teacher_id = ?
  `;
  const params = [teacherId];

  if (subject) {
    query += " AND cl.subject = ?";
    params.push(SUBJECT_MAP[subject] || subject);
  }

  if (classId) {
    query += " AND (cl.class_id = ? OR cl.class_id IS NULL)";
    params.push(classId);
  }

  query += " GROUP BY cl.id ORDER BY cl.created_at DESC;";

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacher_id,
    classId: r.class_id,
    className: r.class_name,
    subject: r.subject,
    title: r.title,
    description: r.description,
    minActivities: r.min_activities || 10,
    activityCount: Number(r.activity_count) || 0,
    isPlayable: (Number(r.activity_count) || 0) >= (r.min_activities || 10),
    createdAt: r.created_at,
  }));
}

export async function deleteCustomLesson(teacherId, lessonId) {
  await pool.query("DELETE FROM custom_exercises WHERE lesson_id = ? AND teacher_id = ?", [lessonId, teacherId]);
  const [res] = await pool.query("DELETE FROM custom_lessons WHERE id = ? AND teacher_id = ?", [lessonId, teacherId]);
  if (res.affectedRows === 0) {
    throw new Error("No se encontró la lección o no tienes permisos para eliminarla.");
  }
  return { success: true };
}

// Obtener lecciones para la vista del alumno
export async function getLessonsForStudent(studentId, subject, classId = null) {
  const normSubject = SUBJECT_MAP[subject] || subject;

  // 1. Obtener lecciones creadas por el docente para esta clase con mínimo 10 actividades
  let customLessons = [];
  if (classId) {
    const [rows] = await pool.query(
      `SELECT cl.*, COUNT(ce.id) AS activity_count
       FROM custom_lessons cl
       JOIN custom_exercises ce ON ce.lesson_id = cl.id
       WHERE cl.subject = ? AND (cl.class_id = ? OR cl.class_id IS NULL)
       GROUP BY cl.id
       HAVING activity_count >= cl.min_activities
       ORDER BY cl.created_at ASC;`,
      [normSubject, classId]
    );

    customLessons = rows;
  }

  // 2. Obtener lecciones ya completadas por el alumno
  const [progressRows] = await pool.query(
    "SELECT lesson_key, completed, score, completed_at FROM user_progress WHERE user_id = ?",
    [studentId]
  );
  const completedMap = new Map();
  progressRows.forEach((p) => completedMap.set(p.lesson_key, p));

  // Claves de la lección de práctica por default
  const practiceKeys = [
    `${normSubject}_practice`,
    normSubject,
    subject,
    normSubject === "math" ? "matematicas" : normSubject === "spanish" ? "espanol" : normSubject === "science" ? "ciencias" : "geografia",
  ];
  const isPracticeCompleted = practiceKeys.some((k) => completedMap.has(k) && Boolean(completedMap.get(k).completed));

  const lessons = [];

  // Lección 1: Lección de Práctica / Ejemplo (Oficial QuestWorld)
  lessons.push({
    id: `${normSubject}_practice`,
    title: "Lección de Práctica / Ejemplo",
    description: "Retos oficiales interactivos para dominar los conceptos clave.",
    subject: normSubject,
    isDefault: true,
    activityCount: 10,
    completed: isPracticeCompleted,
    completedAt: practiceKeys.find((k) => completedMap.has(k)) ? completedMap.get(practiceKeys.find((k) => completedMap.has(k)))?.completed_at : null,
  });

  // Lecciones creadas por el profesor (que cumplan el mínimo de 10 actividades)
  for (const cl of customLessons) {
    const rawKey = String(cl.id);
    const prefixedKey = rawKey.startsWith("lesson_") ? rawKey : `lesson_${rawKey}`;
    const unPrefixedKey = rawKey.replace(/^lesson_/, "");
    const matchingKey = [rawKey, prefixedKey, unPrefixedKey, `lesson_${prefixedKey}`].find((k) => completedMap.has(k));
    const isCompleted = matchingKey ? Boolean(completedMap.get(matchingKey).completed) : false;
    lessons.push({
      id: cl.id,
      title: cl.title,
      description: cl.description || "Lección creada por tu profesor para el grupo.",
      subject: cl.subject,
      isDefault: false,
      activityCount: Number(cl.activity_count) || 10,
      completed: isCompleted,
      completedAt: matchingKey ? completedMap.get(matchingKey)?.completed_at : null,
    });
  }

  const isSubjectCompleted = lessons.length > 0 && lessons.every((l) => l.completed);

  return {
    subject: normSubject,
    classId,
    lessons,
    isSubjectCompleted,
    completedCount: lessons.filter((l) => l.completed).length,
    totalCount: lessons.length,
  };
}

// Obtener los ejercicios de una lección específica formateados según la dinámica de la materia
export async function getLessonExercises(lessonId, subject) {
  const normSubject = SUBJECT_MAP[subject] || subject;

  // Si es la lección de práctica, retornar indicador de práctica
  if (lessonId === `${normSubject}_practice` || lessonId === "practice" || lessonId === normSubject) {
    return {
      id: `${normSubject}_practice`,
      isDefault: true,
      subject: normSubject,
      title: "Lección de Práctica / Ejemplo",
      exercises: [], // El frontend usará el catálogo local oficial de 10 actividades
    };
  }

  // Si es una lección personalizada del profesor
  const [lessonRows] = await pool.query("SELECT * FROM custom_lessons WHERE id = ?", [lessonId]);
  if (lessonRows.length === 0) {
    throw new Error("Lección no encontrada.");
  }
  const lesson = lessonRows[0];

  const [exerciseRows] = await pool.query(
    "SELECT * FROM custom_exercises WHERE lesson_id = ? ORDER BY id ASC;",
    [lessonId]
  );

  const formattedExercises = exerciseRows.map((ex, index) => {
    let extraData = {};
    if (typeof ex.data_json === "string") {
      try {
        extraData = JSON.parse(ex.data_json);
      } catch (_) {}
    } else if (ex.data_json && typeof ex.data_json === "object") {
      extraData = ex.data_json;
    }

    let parsedOptions = [];
    if (typeof ex.options_json === "string") {
      try {
        parsedOptions = JSON.parse(ex.options_json);
      } catch (_) {}
    } else if (Array.isArray(ex.options_json)) {
      parsedOptions = ex.options_json;
    }

    // Adaptación a la dinámica específica
    if (normSubject === "spanish") {
      return {
        id: ex.id,
        type: extraData.type || "adivinanza",
        clue: ex.question || extraData.clue,
        clueEmoji: extraData.clueEmoji || "📖",
        helperText: extraData.helperText || "Descubre las letras faltantes",
        targetWord: String(extraData.targetWord || ex.correct_answer || "").toUpperCase().trim(),
        displayPattern: extraData.displayPattern || Array.from(String(extraData.targetWord || ex.correct_answer || "").toUpperCase()),
        explanation: ex.explanation || `¡La respuesta correcta es ${ex.correct_answer}!`,
        points: ex.points || 10,
      };
    }

    if (normSubject === "science") {
      return {
        id: ex.id,
        title: ex.title || extraData.title || `Proceso Natural ${index + 1}`,
        instruction: ex.question || extraData.instruction || "Ordena los pasos correctamente:",
        icon: extraData.icon || "🌱",
        items: extraData.items || [
          { id: "step1", label: "Paso 1", emoji: "🌱" },
          { id: "step2", label: "Paso 2", emoji: "🌿" },
          { id: "step3", label: "Paso 3", emoji: "🌸" },
          { id: "step4", label: "Paso 4", emoji: "🌻" },
        ],
        correctOrder: extraData.correctOrder || ["step1", "step2", "step3", "step4"],
        explanation: ex.explanation || "Secuencia natural ordenada con éxito.",
        points: ex.points || 10,
      };
    }

    // Matemáticas y Geografía (opciones múltiples A, B, C, D)
    const options = parsedOptions.length > 0 ? parsedOptions : [ex.correct_answer];
    if (!options.includes(ex.correct_answer)) {
      options.unshift(ex.correct_answer);
    }

    return {
      id: ex.id,
      question: ex.question,
      helperText: extraData.helperText || (normSubject === "geography" ? "Pista del explorador" : "Pista didáctica"),
      options,
      correctAnswer: ex.correct_answer,
      explanation: ex.explanation || `¡Respuesta correcta: ${ex.correct_answer}!`,
      points: ex.points || 10,
    };
  });

  return {
    id: lesson.id,
    isDefault: false,
    subject: lesson.subject,
    title: lesson.title,
    description: lesson.description,
    activityCount: formattedExercises.length,
    exercises: formattedExercises,
  };
}

// Seguimiento del profesor: ver qué alumnos completaron o tienen pendiente una lección
export async function getLessonStudentProgress(teacherId, lessonId, classId = null) {
  // Verificar lección
  const [lessonRows] = await pool.query(
    "SELECT * FROM custom_lessons WHERE id = ? AND teacher_id = ?",
    [lessonId, teacherId]
  );
  if (lessonRows.length === 0) {
    throw new Error("Lección no encontrada o no autorizada.");
  }
  const lesson = lessonRows[0];
  const targetClassId = classId || lesson.class_id;

  if (!targetClassId) {
    return {
      lesson,
      totalStudents: 0,
      completedCount: 0,
      pendingCount: 0,
      completedStudents: [],
      pendingStudents: [],
    };
  }

  // Alumnos inscritos en la clase
  const [studentsRows] = await pool.query(
    `SELECT u.id, u.name, u.avatar, cs.points AS class_points, cs.joined_at
     FROM class_students cs
     JOIN users u ON cs.student_id = u.id
     WHERE cs.class_id = ?
     ORDER BY u.name ASC;`,
    [targetClassId]
  );

  const rawKey = String(lessonId);
  const prefixedKey = rawKey.startsWith("lesson_") ? rawKey : `lesson_${rawKey}`;
  const unPrefixedKey = rawKey.replace(/^lesson_/, "");
  const doublePrefixed = `lesson_${prefixedKey}`;

  // Progreso de estos alumnos en la lección
  const [progressRows] = await pool.query(
    `SELECT user_id, completed, score, completed_at
     FROM user_progress
     WHERE lesson_key IN (?, ?, ?, ?) AND user_id IN (
       SELECT student_id FROM class_students WHERE class_id = ?
     );`,
    [rawKey, prefixedKey, unPrefixedKey, doublePrefixed, targetClassId]
  );

  const progressMap = new Map();
  progressRows.forEach((p) => progressMap.set(p.user_id, p));

  const completedStudents = [];
  const pendingStudents = [];

  studentsRows.forEach((s) => {
    const prog = progressMap.get(s.id);
    const studentInfo = {
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      classPoints: Number(s.class_points) || 0,
    };

    if (prog && Boolean(prog.completed)) {
      completedStudents.push({
        ...studentInfo,
        completed: true,
        score: prog.score || 0,
        completedAt: prog.completed_at,
      });
    } else {
      pendingStudents.push({
        ...studentInfo,
        completed: false,
      });
    }
  });

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
    },
    totalStudents: studentsRows.length,
    completedCount: completedStudents.length,
    pendingCount: pendingStudents.length,
    completedStudents,
    pendingStudents,
  };
}
