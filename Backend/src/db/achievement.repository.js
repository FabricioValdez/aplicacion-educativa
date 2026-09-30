import { pool } from "../config/database.js";

export async function getUserAchievements(userId) {
  const [userRows] = await pool.query("SELECT points, streak_days FROM users WHERE id = ?", [userId]);
  if (userRows.length === 0) return [];

  const points = Number(userRows[0].points) || 0;
  const streak = Number(userRows[0].streak_days) || 0;

  const [allAchievements] = await pool.query(
    "SELECT * FROM achievements ORDER BY required_points ASC, required_streak ASC"
  );

  const [unlockedRows] = await pool.query(
    "SELECT achievement_id FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  const explicitlyUnlocked = new Set(unlockedRows.map((r) => r.achievement_id));

  const result = [];
  for (const ach of allAchievements) {
    const isUnlocked =
      explicitlyUnlocked.has(ach.id) ||
      (points >= ach.required_points && streak >= ach.required_streak);

    if (isUnlocked && !explicitlyUnlocked.has(ach.id)) {
      await pool.query(
        "INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
        [userId, ach.id]
      );
    }

    result.push({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      category: ach.category,
      pointsReward: Number(ach.points_reward) || 20,
      requiredPoints: Number(ach.required_points) || 0,
      requiredStreak: Number(ach.required_streak) || 0,
      unlocked: isUnlocked,
    });
  }

  return result;
}
