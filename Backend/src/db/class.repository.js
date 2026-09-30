import { pool } from "../config/database.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

async function generateUniqueClassCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    }
    const [existing] = await pool.query("SELECT id FROM classes WHERE code = ?", [code]);
    if (existing.length === 0) {
      return code;
    }
  }
  return `CLS${Date.now().toString().slice(-4)}`;
}

export async function createClass(teacherId, { name, description = "", subject = "general" }) {
  const cleanName = String(name || "").trim();
  if (!cleanName) {
    throw new Error("El nombre de la clase es obligatorio.");
  }

  const classId = `cls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const code = await generateUniqueClassCode();

  await pool.query(
    `INSERT INTO classes (id, code, name, description, subject, teacher_id)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [classId, code, cleanName, description || null, subject || "general", teacherId]
  );

  const [rows] = await pool.query("SELECT * FROM classes WHERE id = ?", [classId]);
  return {
    ...rows[0],
    student_count: 0,
  };
}

export async function getClassesForTeacher(teacherId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.code, c.name, c.description, c.subject, c.teacher_id, c.created_at,
            COUNT(cs.student_id) AS student_count
     FROM classes c
     LEFT JOIN class_students cs ON c.id = cs.class_id
     WHERE c.teacher_id = ?
     GROUP BY c.id, c.code, c.name, c.description, c.subject, c.teacher_id, c.created_at
     ORDER BY c.created_at DESC;`,
    [teacherId]
  );
  return rows.map((r) => ({
    ...r,
    student_count: Number(r.student_count) || 0,
  }));
}

export async function getClassesForStudent(studentId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.code, c.name, c.description, c.subject, c.teacher_id,
            u.name AS teacher_name,
            cs.points AS class_points,
            cs.joined_at
     FROM class_students cs
     JOIN classes c ON cs.class_id = c.id
     JOIN users u ON c.teacher_id = u.id
     WHERE cs.student_id = ?
     ORDER BY cs.joined_at DESC;`,
    [studentId]
  );
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    subject: r.subject,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name,
    classPoints: Number(r.class_points) || 0,
    joinedAt: r.joined_at,
  }));
}

export async function joinClassByCode(studentId, rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) {
    throw new Error("Debes proporcionar el código de la clase.");
  }

  const [classRows] = await pool.query(
    `SELECT c.*, u.name AS teacher_name
     FROM classes c
     JOIN users u ON c.teacher_id = u.id
     WHERE UPPER(c.code) = ?`,
    [code]
  );

  if (classRows.length === 0) {
    throw new Error("No encontramos ninguna clase con ese código. Verifica que esté bien escrito.");
  }

  const classData = classRows[0];

  const [existing] = await pool.query(
    "SELECT points FROM class_students WHERE class_id = ? AND student_id = ?",
    [classData.id, studentId]
  );

  if (existing.length > 0) {
    return {
      id: classData.id,
      code: classData.code,
      name: classData.name,
      description: classData.description,
      subject: classData.subject,
      teacherId: classData.teacher_id,
      teacherName: classData.teacher_name,
      classPoints: Number(existing[0].points) || 0,
      alreadyEnrolled: true,
    };
  }

  await pool.query(
    "INSERT INTO class_students (class_id, student_id, points) VALUES (?, ?, 0);",
    [classData.id, studentId]
  );

  return {
    id: classData.id,
    code: classData.code,
    name: classData.name,
    description: classData.description,
    subject: classData.subject,
    teacherId: classData.teacher_id,
    teacherName: classData.teacher_name,
    classPoints: 0,
    alreadyEnrolled: false,
  };
}

export async function addPointsToClass(studentId, classId, points) {
  const pts = Number(points) || 0;
  if (pts <= 0) return 0;

  await pool.query(
    "UPDATE class_students SET points = points + ? WHERE student_id = ? AND class_id = ?;",
    [pts, studentId, classId]
  );

  const [rows] = await pool.query(
    "SELECT points FROM class_students WHERE student_id = ? AND class_id = ?;",
    [studentId, classId]
  );

  return Number(rows[0]?.points || 0);
}

export async function getStudentsInClass(teacherId, classId) {
  const [classCheck] = await pool.query(
    "SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?",
    [classId, teacherId]
  );

  if (classCheck.length === 0) {
    throw new Error("Clase no encontrada o no autorizada.");
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.avatar, cs.points AS class_points, cs.joined_at
     FROM class_students cs
     JOIN users u ON cs.student_id = u.id
     WHERE cs.class_id = ?
     ORDER BY cs.points DESC, u.name ASC;`,
    [classId]
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    classPoints: Number(r.class_points) || 0,
    joinedAt: r.joined_at,
  }));
}
