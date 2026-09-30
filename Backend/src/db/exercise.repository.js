import { pool } from "../config/database.js";

export async function createCustomExercise(teacherId, data) {
  const {
    classId = null,
    lessonId = null,
    subject = "math",
    title,
    question,
    options = [],
    correctAnswer,
    explanation = "",
    points = 10,
    dataJson = null,
  } = data;

  const cleanTitle = String(title || "").trim();
  const cleanQuestion = String(question || data.clue || data.instruction || "").trim();
  const cleanCorrectAnswer = String(correctAnswer || data.targetWord || (data.correctOrder ? data.correctOrder.join(",") : "") || "").trim();

  if (!cleanQuestion) {
    throw new Error("El planteamiento o pregunta del ejercicio es obligatorio.");
  }
  if (!cleanCorrectAnswer && subject !== "science") {
    throw new Error("Debes indicar cuál es la respuesta correcta.");
  }

  const [result] = await pool.query(
    `INSERT INTO custom_exercises 
      (teacher_id, class_id, lesson_id, subject, title, question, options_json, correct_answer, explanation, data_json, points)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      teacherId,
      classId || null,
      lessonId || null,
      subject,
      cleanTitle || "Ejercicio creado por el profesor",
      cleanQuestion,
      JSON.stringify(options || []),
      cleanCorrectAnswer || "secuencia",
      explanation || "",
      dataJson ? JSON.stringify(dataJson) : null,
      Number(points) || 10,
    ]
  );

  const [rows] = await pool.query("SELECT * FROM custom_exercises WHERE id = ?", [result.insertId]);
  const row = rows[0];
  return {
    id: row.id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    lessonId: row.lesson_id,
    subject: row.subject,
    title: row.title,
    question: row.question,
    options: typeof row.options_json === "string" ? JSON.parse(row.options_json) : (row.options_json || []),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    dataJson: typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json,
    points: row.points,
    createdAt: row.created_at,
  };
}

export async function getExercisesBySubject(subject, classId = null) {
  let query = "SELECT * FROM custom_exercises WHERE subject = ?";
  const params = [subject];

  if (classId) {
    query += " AND (class_id = ? OR class_id IS NULL)";
    params.push(classId);
  }

  query += " ORDER BY created_at DESC;";

  const [rows] = await pool.query(query, params);
  return rows.map((row) => ({
    id: row.id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    subject: row.subject,
    title: row.title,
    question: row.question,
    options: typeof row.options_json === "string" ? JSON.parse(row.options_json) : (row.options_json || []),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    points: row.points,
    createdAt: row.created_at,
  }));
}

export async function getExercisesByTeacher(teacherId) {
  const [rows] = await pool.query(
    `SELECT ce.*, c.name AS class_name
     FROM custom_exercises ce
     LEFT JOIN classes c ON ce.class_id = c.id
     WHERE ce.teacher_id = ?
     ORDER BY ce.created_at DESC;`,
    [teacherId]
  );

  return rows.map((row) => ({
    id: row.id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    className: row.class_name,
    subject: row.subject,
    title: row.title,
    question: row.question,
    options: typeof row.options_json === "string" ? JSON.parse(row.options_json) : (row.options_json || []),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    points: row.points,
    createdAt: row.created_at,
  }));
}

export async function deleteCustomExercise(exerciseId, teacherId) {
  const [result] = await pool.query(
    "DELETE FROM custom_exercises WHERE id = ? AND teacher_id = ?;",
    [exerciseId, teacherId]
  );
  return result.affectedRows > 0;
}
