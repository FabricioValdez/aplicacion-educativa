import { pool } from "../src/config/database.js";
import {
  createCustomLesson,
  deleteCustomLesson,
  getLessonExercises,
  getLessonStudentProgress,
  getLessonsForStudent,
} from "../src/db/lesson.repository.js";
import { createCustomExercise } from "../src/db/exercise.repository.js";
import { createClass, joinClassByCode } from "../src/db/class.repository.js";
import { recordLessonProgress } from "../src/db/user.repository.js";

async function run() {
  console.log("=== INICIO DE PRUEBA DE FLUJO COMPLETO: LECCIONES Y SEGUIMIENTO ===");

  // 1. Obtener profesor y alumno existentes
  const [teachers] = await pool.query("SELECT id, name FROM users WHERE role = 'adult' LIMIT 1;");
  const [students] = await pool.query("SELECT id, name FROM users WHERE role = 'child' LIMIT 1;");

  if (teachers.length === 0 || students.length === 0) {
    console.error("No se encontraron usuarios necesarios.");
    process.exit(1);
  }

  const teacher = teachers[0];
  const student = students[0];
  console.log(`Profesor: ${teacher.name} (${teacher.id}) | Alumno: ${student.name} (${student.id})`);

  // 2. Crear una clase de prueba
  const testClass = await createClass(teacher.id, {
    name: "Grupo 4to Grado - Ciencias",
    subject: "science",
    description: "Clase de prueba para flujo de lecciones",
  });
  console.log(`Clase creada: ${testClass.name} [Código: ${testClass.code}]`);

  // 3. Alumno se une a la clase
  await joinClassByCode(student.id, testClass.code);
  console.log(`Alumno ${student.name} se unió a la clase con éxito.`);

  // 4. Crear lección personalizada de Ciencias
  const customLesson = await createCustomLesson(teacher.id, {
    classId: testClass.id,
    subject: "science",
    title: "Lección 1: El Ciclo de las Plantas y Animales",
    description: "Aprende los procesos de la naturaleza ordenando las fases.",
  });
  console.log(`Lección creada por profesor: ${customLesson.title} (ID: ${customLesson.id})`);

  // 5. Agregar 9 actividades de Ciencias
  console.log("Agregando 9 actividades...");
  for (let i = 1; i <= 9; i++) {
    await createCustomExercise(teacher.id, {
      classId: testClass.id,
      lessonId: customLesson.id,
      subject: "science",
      title: `Ciclo Natural ${i}`,
      question: `Ordena los pasos del ciclo ${i}:`,
      dataJson: {
        title: `Ciclo Natural ${i}`,
        instruction: "Ordena las fases cronológicamente:",
        icon: "🌿",
        items: [
          { id: "s1", label: "Semilla", emoji: "🌱" },
          { id: "s2", label: "Brote", emoji: "🌿" },
          { id: "s3", label: "Flor", emoji: "🌸" },
          { id: "s4", label: "Fruto", emoji: "🍎" },
        ],
        correctOrder: ["s1", "s2", "s3", "s4"],
        explanation: "Secuencia correcta.",
      },
      points: 10,
    });
  }

  // Verificar estado para el alumno con 9 actividades (< 10)
  let studentLessons = await getLessonsForStudent(student.id, "science", testClass.id);
  console.log(`Lecciones visibles para alumno con 9 actividades: ${studentLessons.lessons.length}`);
  // Debe haber solo 1 lección (la de práctica) porque la lección del profesor aún no tiene 10
  const teacherLessonVisibleBefore10 = studentLessons.lessons.some((l) => l.id === customLesson.id);
  console.log(`¿Lección con 9 actividades visible para alumno?: ${teacherLessonVisibleBefore10} (Debe ser false)`);

  // 6. Agregar la actividad número 10
  console.log("Agregando la actividad número 10...");
  await createCustomExercise(teacher.id, {
    classId: testClass.id,
    lessonId: customLesson.id,
    subject: "science",
    title: "Ciclo Natural 10: Metamorfosis",
    question: "Ordena las etapas de la mariposa:",
    dataJson: {
      title: "Metamorfosis de la Mariposa",
      instruction: "Ordena desde el huevo hasta la mariposa:",
      icon: "🦋",
      items: [
        { id: "e1", label: "Huevo", emoji: "🥚" },
        { id: "e2", label: "Oruga", emoji: "🐛" },
        { id: "e3", label: "Capullo", emoji: "🥥" },
        { id: "e4", label: "Mariposa", emoji: "🦋" },
      ],
      correctOrder: ["e1", "e2", "e3", "e4"],
      explanation: "¡Completaste la metamorfosis!",
    },
    points: 10,
  });

  // Verificar estado para el alumno con 10 actividades (>= 10)
  studentLessons = await getLessonsForStudent(student.id, "science", testClass.id);
  console.log(`Lecciones visibles para alumno con 10 actividades: ${studentLessons.lessons.length}`);
  const teacherLessonVisibleAfter10 = studentLessons.lessons.find((l) => l.id === customLesson.id);
  console.log(`¿Lección con 10 actividades visible para alumno?: ${Boolean(teacherLessonVisibleAfter10)} (Debe ser true)`);
  console.log(`Actividades reportadas en la lección: ${teacherLessonVisibleAfter10?.activityCount}`);

  // 7. Seguimiento del profesor ANTES de que el alumno juegue
  let progressReport = await getLessonStudentProgress(teacher.id, customLesson.id, testClass.id);
  console.log("--- SEGUIMIENTO DEL PROFESOR (ANTES DE COMPLETAR) ---");
  console.log(`Total alumnos: ${progressReport.totalStudents}`);
  console.log(`Completaron: ${progressReport.completedCount} (${progressReport.completedStudents.map((s) => s.name).join(", ") || "Ninguno"})`);
  console.log(`Pendientes: ${progressReport.pendingCount} (${progressReport.pendingStudents.map((s) => s.name).join(", ")})`);

  const lessonKey = `lesson_${customLesson.id}`;
  await recordLessonProgress(student.id, lessonKey, 100);
  console.log(`Progreso guardado: ${lessonKey} completada por alumno.`);

  // 9. Seguimiento del profesor DESPUÉS de que el alumno completa
  progressReport = await getLessonStudentProgress(teacher.id, customLesson.id, testClass.id);
  console.log("--- SEGUIMIENTO DEL PROFESOR (DESPUÉS DE COMPLETAR) ---");
  console.log(`Completaron: ${progressReport.completedCount} (${progressReport.completedStudents.map((s) => s.name).join(", ")})`);
  console.log(`Pendientes: ${progressReport.pendingCount}`);

  // 10. Alumno consulta sus lecciones nuevamente
  studentLessons = await getLessonsForStudent(student.id, "science", testClass.id);
  const completedLessonInList = studentLessons.lessons.find((l) => l.id === customLesson.id);
  console.log(`¿La lección aparece con completed = true?: ${completedLessonInList?.completed}`);

  // 11. Limpieza de datos de prueba
  await deleteCustomLesson(teacher.id, customLesson.id);
  await pool.query("DELETE FROM class_students WHERE class_id = ?", [testClass.id]);
  await pool.query("DELETE FROM classes WHERE id = ?", [testClass.id]);
  await pool.query("DELETE FROM user_progress WHERE user_id = ? AND lesson_key = ?", [student.id, lessonKey]);
  console.log("Limpieza completada.");

  console.log("=== PRUEBA DE FLUJO COMPLETO EXITOSA ===");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error en prueba de flujo:", err);
  process.exit(1);
});
