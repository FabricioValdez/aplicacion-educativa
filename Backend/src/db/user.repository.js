import { pool } from "../config/database.js";

export function formatUserRow(row, activeDays = [], completedLessons = []) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    points: Number(row.points) || 0,
    streakDays: Number(row.streak_days) || 0,
    streakProtected: Boolean(row.streak_protected),
    streakShields: row.streak_shields !== undefined ? Number(row.streak_shields) : 2,
    hasSubscription: Boolean(row.has_subscription),
    lastActiveDate: row.last_active_date,
    completedChallenges: Number(row.completed_challenges) || 0,
    activeDays,
    completedLessons,
  };
}

export async function getUserFullDetails(userId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (rows.length === 0) return null;

  const [activeDaysRows] = await pool.query(
    "SELECT active_date FROM user_active_days WHERE user_id = ? ORDER BY active_date ASC",
    [userId]
  );
  const activeDays = activeDaysRows.map((r) => r.active_date);

  const [progressRows] = await pool.query(
    "SELECT lesson_key FROM user_progress WHERE user_id = ?",
    [userId]
  );
  const completedLessons = progressRows.map((r) => r.lesson_key);

  return formatUserRow(rows[0], activeDays, completedLessons);
}

export async function findUserForLogin(name, password, role) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE LOWER(name) = ? AND password = ? AND role = ?",
    [String(name).trim().toLowerCase(), String(password), role]
  );
  if (rows.length === 0) return null;
  return getUserFullDetails(rows[0].id);
}

export async function registerUser({ name, password, role = "child", avatar = "astronaut" }) {
  const cleanName = String(name || "").trim();
  const cleanPassword = String(password || "").trim();
  const cleanRole = role === "adult" ? "adult" : "child";
  const cleanAvatar = String(avatar || "astronaut");

  if (!cleanName || cleanName.length < 2) {
    throw new Error("El nombre debe tener al menos 2 caracteres.");
  }
  if (!cleanPassword || cleanPassword.length < 3) {
    throw new Error("La clave debe tener al menos 3 caracteres.");
  }

  const [existing] = await pool.query(
    "SELECT id FROM users WHERE LOWER(name) = ? AND role = ?",
    [cleanName.toLowerCase(), cleanRole]
  );

  if (existing.length > 0) {
    throw new Error(`Ya existe una cuenta con el nombre '${cleanName}' para este perfil.`);
  }

  const newId = `${cleanRole === "adult" ? "teacher" : "student"}_${Date.now()}`;

  await pool.query(
    `INSERT INTO users (id, name, password, role, avatar, points, streak_days, streak_protected, streak_shields, completed_challenges)
     VALUES (?, ?, ?, ?, ?, 0, 0, TRUE, 2, 0);`,
    [newId, cleanName, cleanPassword, cleanRole, cleanAvatar]
  );

  return getUserFullDetails(newId);
}


export async function updateUserStreak(userId, today, isConsecutive) {
  const [rows] = await pool.query("SELECT streak_days, last_active_date FROM users WHERE id = ?", [userId]);
  if (rows.length === 0) return null;

  const currentStreak = Number(rows[0].streak_days) || 0;
  const newStreak = isConsecutive ? currentStreak + 1 : 1;

  await pool.query(
    "UPDATE users SET streak_days = ?, last_active_date = ? WHERE id = ?",
    [newStreak, today, userId]
  );

  await pool.query(
    "INSERT IGNORE INTO user_active_days (user_id, active_date) VALUES (?, ?)",
    [userId, today]
  );

  return getUserFullDetails(userId);
}

export async function addPointsToUser(userId, points) {
  await pool.query("UPDATE users SET points = points + ? WHERE id = ?;", [points, userId]);
  const [rows] = await pool.query("SELECT points FROM users WHERE id = ?;", [userId]);
  return Number(rows[0]?.points ?? 0);
}

export async function recordLessonProgress(userId, completedLesson, score = 10, maxChallenges = 5) {
  await pool.query(
    "UPDATE users SET completed_challenges = LEAST(?, completed_challenges + 1) WHERE id = ?;",
    [maxChallenges, userId]
  );

  if (completedLesson) {
    await pool.query(
      `INSERT INTO user_progress (user_id, lesson_key, completed, score)
       VALUES (?, ?, TRUE, ?)
       ON DUPLICATE KEY UPDATE score = VALUES(score), completed_at = CURRENT_TIMESTAMP;`,
      [userId, completedLesson, score]
    );
  }

  return getUserFullDetails(userId);
}

export async function updateUserProfile(userId, { name, avatar, currentPassword, newPassword }) {
  const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (userRows.length === 0) throw new Error("Usuario no encontrado.");
  const existingUser = userRows[0];

  const updates = [];
  const params = [];

  if (name && name.trim()) {
    const cleanName = name.trim();
    if (cleanName.length < 2) throw new Error("El nombre debe tener al menos 2 caracteres.");

    // Verificar si otro usuario con el mismo rol ya tiene ese nombre
    const [dup] = await pool.query(
      "SELECT id FROM users WHERE LOWER(name) = ? AND role = ? AND id != ?",
      [cleanName.toLowerCase(), existingUser.role, userId]
    );
    if (dup.length > 0) throw new Error(`Ya existe una cuenta con el nombre '${cleanName}'.`);

    updates.push("name = ?");
    params.push(cleanName);
  }

  if (avatar && avatar.trim()) {
    updates.push("avatar = ?");
    params.push(avatar.trim());
  }

  if (newPassword && newPassword.trim()) {
    const cleanNewPass = newPassword.trim();
    if (cleanNewPass.length < 3) throw new Error("La nueva clave debe tener al menos 3 caracteres.");

    if (!currentPassword || String(currentPassword) !== String(existingUser.password)) {
      throw new Error("La clave secreta actual es incorrecta.");
    }

    updates.push("password = ?");
    params.push(cleanNewPass);
  }

  if (updates.length > 0) {
    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
  }

  return getUserFullDetails(userId);
}

export async function buyStreakShieldWithPoints(userId, shieldCost = 500) {
  const [rows] = await pool.query("SELECT points, streak_shields FROM users WHERE id = ?", [userId]);
  if (rows.length === 0) throw new Error("Usuario no encontrado.");

  const currentPoints = Number(rows[0].points) || 0;
  const currentShields = Number(rows[0].streak_shields) || 0;

  if (currentPoints < shieldCost) {
    throw new Error(
      `Puntos insuficientes. Cada protector de racha cuesta ${shieldCost} ⭐ pero solo tienes ${currentPoints} ⭐. ¡Sigue completando lecciones para ganar más!`
    );
  }

  await pool.query(
    "UPDATE users SET points = points - ?, streak_shields = streak_shields + 1 WHERE id = ?",
    [shieldCost, userId]
  );

  const updatedUser = await getUserFullDetails(userId);
  return {
    success: true,
    points: updatedUser.points,
    streakShields: updatedUser.streakShields,
    message: "¡Protector de racha adquirido exitosamente! 🛡️",
  };
}

