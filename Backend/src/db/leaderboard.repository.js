import { pool } from "../config/database.js";

const medals = ["🥇", "🥈", "🥉", "#4", "#5", "#6", "#7", "#8", "#9", "#10"];

export const AVATAR_MAP = {
  astronaut: "🚀",
  dino: "🦖",
  cat: "🐱",
  robot: "🤖",
  star: "⭐",
  lion: "🦁",
};

export function formatAvatar(avatar) {
  if (!avatar) return "🚀";
  if (AVATAR_MAP[avatar]) return AVATAR_MAP[avatar];
  return avatar;
}

const LEAGUE_ICONS = {
  bronce: "🥉",
  plata: "🥈",
  oro: "🥇",
  zafiro: "💎",
  rubi: "🔮",
  esmeralda: "🌲",
  diamante: "💠",
  cosmica: "👑",
};

export async function getLeaderboard(currentUserId, targetClassId = null) {
  let classId = targetClassId;

  // 1. Si no viene classId, buscar la clase más reciente en la que está inscrito el alumno
  if (!classId) {
    const [enrollmentRows] = await pool.query(
      "SELECT class_id FROM class_students WHERE student_id = ? ORDER BY joined_at DESC LIMIT 1",
      [currentUserId]
    );
    if (enrollmentRows.length > 0) {
      classId = enrollmentRows[0].class_id;
    }
  }

  // 2. Obtener todas las 8 ligas disponibles
  const [allLeaguesRows] = await pool.query("SELECT * FROM leagues ORDER BY min_points ASC");
  const allLeagues = allLeaguesRows.map((l) => ({
    id: l.id,
    name: l.name,
    icon: LEAGUE_ICONS[l.id] || "🏆",
    description: l.description,
    promotionText: l.promotion_text,
    countdownText: l.countdown_text,
    minPoints: Number(l.min_points) || 0,
  }));

  // 3. Si el alumno no pertenece a ninguna clase
  if (!classId) {
    const lowestLeague = allLeagues[0] || {
      id: "bronce",
      name: "Liga Bronce",
      icon: "🥉",
      description: "¡Bienvenido a la liga inicial!",
      promotionText: "🥉 Alcanza 100 XP para ascender a la Liga Plata",
      countdownText: "Temporada activa",
      minPoints: 0,
    };
    return {
      classInfo: null,
      currentPoints: 0,
      league: lowestLeague,
      nextLeague: allLeagues[1] || null,
      pointsToNext: allLeagues[1] ? allLeagues[1].minPoints : 0,
      allLeagues,
      ranking: [],
      message: "Aún no te has unido a ninguna clase escolar. ¡Ingresa el código de tu profesor para comenzar a competir en la Liga!",
    };
  }

  // 4. Datos de la clase
  const [classRows] = await pool.query("SELECT id, name, code, subject FROM classes WHERE id = ?", [classId]);
  const classInfo = classRows[0] || null;

  // 5. Puntos del alumno actual en esta clase específica
  const [studentInClassRows] = await pool.query(
    "SELECT points FROM class_students WHERE student_id = ? AND class_id = ?",
    [currentUserId, classId]
  );
  const studentClassPoints = Number(studentInClassRows[0]?.points ?? 0);

  // 6. Determinar la liga actual según sus puntos en esta clase
  const [leagueRows] = await pool.query(
    "SELECT * FROM leagues WHERE min_points <= ? ORDER BY min_points DESC LIMIT 1",
    [studentClassPoints]
  );
  const currentLeagueRaw = leagueRows[0] || allLeaguesRows[0];
  const currentLeague = {
    id: currentLeagueRaw.id,
    name: currentLeagueRaw.name,
    icon: LEAGUE_ICONS[currentLeagueRaw.id] || "🏆",
    description: currentLeagueRaw.description,
    promotionText: currentLeagueRaw.promotion_text,
    countdownText: currentLeagueRaw.countdown_text,
    minPoints: Number(currentLeagueRaw.min_points) || 0,
  };

  // 7. Siguiente liga y puntos restantes
  const [nextLeagueRows] = await pool.query(
    "SELECT * FROM leagues WHERE min_points > ? ORDER BY min_points ASC LIMIT 1",
    [studentClassPoints]
  );
  const nextLeagueRaw = nextLeagueRows[0] || null;
  const nextLeague = nextLeagueRaw
    ? {
        id: nextLeagueRaw.id,
        name: nextLeagueRaw.name,
        icon: LEAGUE_ICONS[nextLeagueRaw.id] || "🏆",
        minPoints: Number(nextLeagueRaw.min_points) || 0,
      }
    : null;

  const pointsToNext = nextLeague ? Math.max(0, nextLeague.minPoints - studentClassPoints) : 0;

  // 8. Ranking de competidores: SOLO alumnos inscritos en esta clase escolar
  const [competitorsRows] = await pool.query(
    `SELECT u.id, u.name, u.avatar, cs.points AS xp, u.streak_days AS streak
     FROM class_students cs
     JOIN users u ON cs.student_id = u.id
     WHERE cs.class_id = ?
     ORDER BY cs.points DESC, u.name ASC`,
    [classId]
  );

  const ranking = competitorsRows.map((competitor, index) => {
    const isCurrent = String(competitor.id) === String(currentUserId);
    return {
      place: index + 1,
      id: competitor.id,
      name: isCurrent ? `${competitor.name} (Tú)` : competitor.name,
      streak: Number(competitor.streak) || 0,
      xp: Number(competitor.xp) || 0,
      avatar: formatAvatar(competitor.avatar),
      medal: medals[index] || `#${index + 1}`,
      current: isCurrent,
    };
  });

  return {
    classInfo: classInfo
      ? {
          id: classInfo.id,
          name: classInfo.name,
          code: classInfo.code,
          subject: classInfo.subject,
        }
      : null,
    currentPoints: studentClassPoints,
    league: currentLeague,
    nextLeague,
    pointsToNext,
    allLeagues,
    ranking,
  };
}
