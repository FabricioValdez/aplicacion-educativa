import { pool } from "../config/database.js";

function safeParseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function getAllActivities() {
  const [rows] = await pool.query(
    "SELECT id, subject, title, level, icon, points, progress_label AS progressLabel, progress_percent AS progressPercent FROM activities"
  );
  return rows;
}

export async function getActivityById(activityId) {
  const [rows] = await pool.query("SELECT * FROM activities WHERE id = ?", [activityId]);
  if (rows.length === 0) return null;

  const row = rows[0];
  const content = safeParseJson(row.content_json) || {};
  const answer = safeParseJson(row.answer_json);

  return {
    id: row.id,
    subject: row.subject,
    title: row.title,
    level: row.level,
    icon: row.icon,
    progressLabel: row.progress_label,
    progressPercent: row.progress_percent,
    points: row.points,
    ...content,
    answer,
  };
}

export async function getDailyChallenge() {
  const [rows] = await pool.query("SELECT * FROM daily_challenges LIMIT 1");
  if (rows.length === 0) {
    return {
      id: "daily-space-mission",
      title: "Misión Espacial Secreta",
      description: "Completa las 4 lecciones para ganar un super cofre con 100 gemas galácticas.",
      total: 4,
    };
  }
  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    total: row.total_target,
  };
}
