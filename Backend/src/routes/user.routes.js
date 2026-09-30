import { Router } from "express";
import { pool } from "../config/database.js";
import { readDatabase, writeDatabase } from "../data.js";
import {
  addPointsToUser,
  buyStreakShieldWithPoints,
  getUserFullDetails,
  recordLessonProgress,
  updateUserProfile,
  updateUserStreak,
} from "../db/user.repository.js";
import { publicUser, requireUser } from "../middlewares/auth.middleware.js";
import { dateDifferenceInDays, getLocalDateKey } from "../utils/date.js";

const router = Router();

// Compatible con /api/user/profile y /api/profile
router.get("/profile", requireUser, async (request, response, next) => {
  try {
    const fullUser = await getUserFullDetails(request.user.id);
    return response.json({ user: publicUser(fullUser || request.user) });
  } catch (error) {
    return next(error);
  }
});

// Actualizar información del perfil (nombre, avatar, contraseña)
const handleProfileUpdate = async (request, response, next) => {
  try {
    const { name, avatar, currentPassword, newPassword } = request.body ?? {};
    const updatedUser = await updateUserProfile(request.user.id, {
      name,
      avatar,
      currentPassword,
      newPassword,
    });
    return response.json({ success: true, user: publicUser(updatedUser) });
  } catch (error) {
    return response.status(400).json({ message: error.message });
  }
};

router.put("/profile", requireUser, handleProfileUpdate);
router.post("/profile/update", requireUser, handleProfileUpdate);

// Comprar protector de racha usando puntos (500 ⭐)
router.post("/buy-shield-points", requireUser, async (request, response, next) => {
  try {
    const result = await buyStreakShieldWithPoints(request.user.id, 500);
    return response.json(result);
  } catch (error) {
    return response.status(400).json({ message: error.message });
  }
});


router.post("/check-streak", requireUser, async (request, response, next) => {
  try {
    const today = getLocalDateKey();
    const user = request.user;
    const lastActiveDate = user.lastActiveDate;

    // Si pasaron más de 1 día sin actividad, verificar escudos protectores
    if (lastActiveDate && lastActiveDate !== today) {
      const difference = dateDifferenceInDays(lastActiveDate, today);
      if (difference > 1) {
        const shields = user.streakShields || 0;
        if (shields > 0) {
          await pool.query(
            "UPDATE users SET streak_shields = GREATEST(0, streak_shields - 1) WHERE id = ?;",
            [user.id]
          );
        } else {
          await pool.query("UPDATE users SET streak_days = 0 WHERE id = ?;", [user.id]);
        }
        const updated = await getUserFullDetails(user.id);
        return response.json({
          success: true,
          streakDays: updated.streakDays,
          activeDays: updated.activeDays,
          streakShields: updated.streakShields,
        });
      }
    }

    return response.json({
      success: true,
      streakDays: user.streakDays,
      activeDays: user.activeDays,
      streakShields: user.streakShields ?? 2,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/add-points", requireUser, async (request, response, next) => {
  try {
    const userId = String(request.user?.id || request.headers["x-user-id"] || "1");
    const points = Number(request.body?.points);

    if (isNaN(points) || points <= 0) {
      const [rows] = await pool.query("SELECT points FROM users WHERE id = ?;", [userId]);
      const currentPoints = Number(rows[0]?.points ?? request.user?.points ?? 0);
      return response.json({
        success: true,
        updatedPoints: currentPoints,
        points: currentPoints,
        newTotalPoints: currentPoints,
      });
    }

    // 1. Ejecutar consulta SQL real sobre MySQL usando el pool
    await pool.query("UPDATE users SET points = points + ? WHERE id = ?;", [points, userId]);

    // 2. Inmediatamente después, hacer SELECT points FROM users WHERE id = ?;
    const [rows] = await pool.query("SELECT points FROM users WHERE id = ?;", [userId]);
    const updatedPoints = Number(rows[0]?.points ?? 0);

    // Sincronizar en db.json si existe
    try {
      const database = await readDatabase();
      const userInDb = database.users?.find((c) => String(c.id) === String(userId));
      if (userInDb) {
        userInDb.points = updatedPoints;
        await writeDatabase(database);
      }
    } catch (fsErr) {
      console.warn("Aviso al guardar en db.json:", fsErr.message);
    }

    // 3. Responder al frontend con { success: true, updatedPoints: row.points, points: row.points }
    return response.json({
      success: true,
      updatedPoints: updatedPoints,
      points: updatedPoints,
      newTotalPoints: updatedPoints,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/progress", requireUser, async (request, response, next) => {
  try {
    const { completedLesson, score = 10, pointsToAdd } = request.body ?? {};
    const userId = request.user.id;

    if (pointsToAdd && Number(pointsToAdd) > 0) {
      await pool.query("UPDATE users SET points = points + ? WHERE id = ?;", [Number(pointsToAdd), userId]);
    }

    const LESSON_ALIASES = {
      math: ["math", "matematicas"],
      matematicas: ["math", "matematicas"],
      spanish: ["spanish", "espanol"],
      espanol: ["spanish", "espanol"],
      science: ["science", "ciencias"],
      ciencias: ["science", "ciencias"],
      geography: ["geography", "geografia"],
      geografia: ["geography", "geografia"],
    };

    if (completedLesson) {
      const keysToInsert = LESSON_ALIASES[completedLesson] || [completedLesson];
      for (const key of keysToInsert) {
        await pool.query(
          `INSERT INTO user_progress (user_id, lesson_key, completed, score)
           VALUES (?, ?, 1, ?)
           ON DUPLICATE KEY UPDATE score = VALUES(score), completed_at = CURRENT_TIMESTAMP;`,
          [userId, key, score]
        );
      }
    }

    // Calcular materias únicas completadas
    const [progressRows] = await pool.query(
      "SELECT lesson_key FROM user_progress WHERE user_id = ? AND completed = 1",
      [userId]
    );
    const userLessonKeys = new Set(progressRows.map((r) => r.lesson_key));
    const SUBJECT_GROUPS = [
      ["math", "matematicas"],
      ["spanish", "espanol"],
      ["science", "ciencias"],
      ["geography", "geografia"],
    ];

    let completedSubjectCount = 0;
    for (const group of SUBJECT_GROUPS) {
      if (group.some((k) => userLessonKeys.has(k))) {
        completedSubjectCount += 1;
      }
    }

    await pool.query(
      "UPDATE users SET completed_challenges = ? WHERE id = ?;",
      [completedSubjectCount, userId]
    );

    // Si completó todas las materias (4 de 4), otorgar 100 puntos extra de Misión Especial
    let bonusAwarded = false;
    if (completedSubjectCount >= 4) {
      const [bonusRows] = await pool.query(
        "SELECT id FROM user_progress WHERE user_id = ? AND lesson_key = 'daily_mission_bonus'",
        [userId]
      );
      if (bonusRows.length === 0) {
        await pool.query("UPDATE users SET points = points + 100 WHERE id = ?;", [userId]);
        await pool.query(
          `INSERT INTO user_progress (user_id, lesson_key, completed, score)
           VALUES (?, 'daily_mission_bonus', 1, 100);`,
          [userId]
        );
        bonusAwarded = true;
      }
    }

    // Activar o avanzar la racha SOLO al completar una lección
    const today = getLocalDateKey();
    if (completedLesson && request.user.lastActiveDate !== today) {
      const difference = request.user.lastActiveDate ? dateDifferenceInDays(request.user.lastActiveDate, today) : 0;
      const isConsecutive = difference === 1 || !request.user.lastActiveDate || request.user.streakDays === 0;
      await updateUserStreak(userId, today, isConsecutive);
    }

    const [userRows] = await pool.query(
      "SELECT points, completed_challenges, streak_days, streak_shields FROM users WHERE id = ?;",
      [userId]
    );
    const currentPoints = Number(userRows[0]?.points ?? request.user.points ?? 0);
    const completedChallenges = Number(userRows[0]?.completed_challenges ?? completedSubjectCount);
    const streakDays = Number(userRows[0]?.streak_days ?? request.user.streakDays ?? 0);
    const streakShields = Number(userRows[0]?.streak_shields ?? request.user.streakShields ?? 2);

    // Sincronizar en db.json
    try {
      const database = await readDatabase();
      const userInDb = database.users?.find((c) => String(c.id) === String(userId));
      if (userInDb) {
        userInDb.points = currentPoints;
        userInDb.completedChallenges = completedChallenges;
        userInDb.streakDays = streakDays;
        userInDb.streakShields = streakShields;
        userInDb.lastActiveDate = today;
        userInDb.completedLessons = Array.from(userLessonKeys);
        await writeDatabase(database);
      }
    } catch (fsErr) {
      console.warn("Aviso al sincronizar db.json en progress:", fsErr.message);
    }

    return response.json({
      success: true,
      points: currentPoints,
      updatedPoints: currentPoints,
      streakDays,
      streakShields,
      completedChallenges,
      completedLessons: Array.from(userLessonKeys),
      dailyMissionCompleted: completedSubjectCount >= 4,
      bonusAwarded,
      message: bonusAwarded
        ? "¡Felicitaciones! Has completado todas las materias y ganado 100 puntos extra del Reto del Día. 🎉"
        : "Progreso guardado exitosamente.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
