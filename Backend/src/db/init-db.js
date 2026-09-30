import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pool, testConnection } from "../config/database.js";
import { activities, dailyChallenge, readDatabase } from "../data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const leaguesToSeed = [
  {
    id: "bronce",
    name: "División Bronce",
    description: "Inicia tu camino en la Liga de Exploradores.",
    promotion_text: "🥉 Los mejores 5 exploradores avanzan a División Plata",
    countdown_text: "Termina en 2d 14h",
    min_points: 0,
  },
  {
    id: "plata",
    name: "División Plata",
    description: "Compite con exploradores en ascenso.",
    promotion_text: "🥈 Los mejores 5 exploradores avanzan a División Zafiro",
    countdown_text: "Termina en 2d 14h",
    min_points: 200,
  },
  {
    id: "zafiro",
    name: "División Zafiro",
    description: "Compite, aprende y sube de división.",
    promotion_text: "💎 Los mejores 5 exploradores avanzan a la División Diamante",
    countdown_text: "Termina en 2d 14h",
    min_points: 400,
  },
  {
    id: "diamante",
    name: "División Diamante",
    description: "La élite de los exploradores galácticos.",
    promotion_text: "👑 ¡Mantente en el podio galáctico!",
    countdown_text: "Termina en 2d 14h",
    min_points: 800,
  },
];

const achievementsToSeed = [
  {
    id: "first_step",
    title: "Primer Paso",
    description: "Comienza tu aventura y resuelve tu primera lección.",
    icon: "🚀",
    category: "progreso",
    required_points: 10,
    required_streak: 0,
    points_reward: 10,
  },
  {
    id: "math_whiz",
    title: "Mago de Números",
    description: "Gana 100 puntos resolviendo retos espaciales.",
    icon: "🧮",
    category: "matemáticas",
    required_points: 100,
    required_streak: 0,
    points_reward: 25,
  },
  {
    id: "fire_streak",
    title: "Racha de Fuego",
    description: "Mantén una racha de al menos 7 días seguidos.",
    icon: "🔥",
    category: "racha",
    required_points: 0,
    required_streak: 7,
    points_reward: 50,
  },
  {
    id: "word_explorer",
    title: "Explorador de Letras",
    description: "Alcanza 200 puntos explorando palabras y crucigramas.",
    icon: "📖",
    category: "español",
    required_points: 200,
    required_streak: 0,
    points_reward: 20,
  },
  {
    id: "green_thumb",
    title: "Pequeño Botánico",
    description: "Alcanza 300 puntos descubriendo ciencias de la naturaleza.",
    icon: "🌱",
    category: "ciencias",
    required_points: 300,
    required_streak: 0,
    points_reward: 25,
  },
  {
    id: "world_traveler",
    title: "Trotamundos",
    description: "Alcanza 350 puntos conociendo monumentos del mundo.",
    icon: "🏛️",
    category: "geografía",
    required_points: 350,
    required_streak: 0,
    points_reward: 25,
  },
  {
    id: "star_collector",
    title: "Coleccionista Estelar",
    description: "Acumula 400 puntos de experiencia o más.",
    icon: "⭐",
    category: "general",
    required_points: 400,
    required_streak: 0,
    points_reward: 50,
  },
  {
    id: "galaxy_champion",
    title: "Campeón Galáctico",
    description: "Alcanza los 1,000 puntos en QuestWorld.",
    icon: "👑",
    category: "general",
    required_points: 1000,
    required_streak: 0,
    points_reward: 100,
  },
];

const competitorsToSeed = [
  { id: "2", name: "Sofía Espacial", password: "1234", role: "child", avatar: "👩🏻‍🚀", points: 540, streakDays: 15, streakProtected: true },
  { id: "3", name: "Lucas Cohete", password: "1234", role: "child", avatar: "🧑🏽‍🚀", points: 480, streakDays: 14, streakProtected: true },
  { id: "4", name: "Valeria Estrella", password: "1234", role: "child", avatar: "👩🏽", points: 390, streakDays: 9, streakProtected: false },
  { id: "5", name: "Mateo Cometa", password: "1234", role: "child", avatar: "🧒🏾", points: 350, streakDays: 8, streakProtected: false },
  { id: "6", name: "Mateo el Astronauta", password: "1234", role: "child", avatar: "🧑🏻‍🚀", points: 310, streakDays: 6, streakProtected: true },
  { id: "7", name: "Profesor Carlos", password: "1234", role: "adult", avatar: "👨‍🏫", points: 0, streakDays: 0, streakProtected: false },
];

async function initializeDatabase() {
  console.log("==> Iniciando inicialización completa de la Base de Datos en MySQL...");

  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ No se pudo conectar a MySQL. Verifica que MySQL esté corriendo en el puerto 3308.");
    process.exit(1);
  }

  // 1. Ejecutar Schema DDL
  const schemaPath = resolve(__dirname, "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const queries = schemaSql
    .split(";")
    .map((query) => query.trim())
    .filter((query) => query.length > 0);

  for (const query of queries) {
    await pool.query(query);
  }
  console.log("✓ Tablas creadas/verificadas exitosamente en MySQL.");

  // 2. Reto Diario
  await pool.query(
    `INSERT INTO daily_challenges (id, title, description, total_target)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), total_target = VALUES(total_target)`,
    [dailyChallenge.id, dailyChallenge.title, dailyChallenge.description, dailyChallenge.total]
  );
  console.log("✓ Reto diario registrado.");

  // 3. Actividades
  for (const [key, act] of Object.entries(activities)) {
    const { id, subject, title, level, icon, progressLabel, progressPercent, points, ...rest } = act;

    let safeContent = { ...rest };
    let answerPayload = act.answer || null;

    if (act.questions) {
      safeContent.questions = act.questions.map(({ correctAnswer, ...q }) => q);
      answerPayload = Object.fromEntries(act.questions.map((q) => [q.id, q.correctAnswer]));
    } else if (act.exercises && id === "spanish") {
      safeContent.exercises = act.exercises.map(({ targetWord, ...ex }) => ex);
      answerPayload = Object.fromEntries(act.exercises.map((ex) => [ex.id, ex.targetWord]));
    } else if (act.exercises && id === "science") {
      safeContent.exercises = act.exercises.map(({ correctOrder, ...ex }) => ex);
      answerPayload = Object.fromEntries(act.exercises.map((ex) => [ex.id, ex.correctOrder]));
    }

    await pool.query(
      `INSERT INTO activities (id, subject, title, level, icon, progress_label, progress_percent, points, content_json, answer_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         subject = VALUES(subject),
         title = VALUES(title),
         level = VALUES(level),
         icon = VALUES(icon),
         progress_label = VALUES(progress_label),
         progress_percent = VALUES(progress_percent),
         points = VALUES(points),
         content_json = VALUES(content_json),
         answer_json = VALUES(answer_json)`,
      [
        id,
        subject,
        title,
        level || "Nivel 1",
        icon || "⭐",
        progressLabel || null,
        progressPercent || 0,
        points || 10,
        JSON.stringify(safeContent),
        JSON.stringify(answerPayload),
      ]
    );
  }
  console.log("✓ Catálogo de actividades registrado.");

  // 4. Ligas y Divisiones
  for (const league of leaguesToSeed) {
    await pool.query(
      `INSERT INTO leagues (id, name, description, promotion_text, countdown_text, min_points)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         promotion_text = VALUES(promotion_text),
         countdown_text = VALUES(countdown_text),
         min_points = VALUES(min_points)`,
      [league.id, league.name, league.description, league.promotion_text, league.countdown_text, league.min_points]
    );
  }
  console.log("✓ Ligas y divisiones registradas.");

  // 5. Catálogo de Logros
  for (const ach of achievementsToSeed) {
    await pool.query(
      `INSERT INTO achievements (id, title, description, icon, category, required_points, required_streak, points_reward)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         icon = VALUES(icon),
         category = VALUES(category),
         required_points = VALUES(required_points),
         required_streak = VALUES(required_streak),
         points_reward = VALUES(points_reward)`,
      [ach.id, ach.title, ach.description, ach.icon, ach.category, ach.required_points, ach.required_streak, ach.points_reward]
    );
  }
  console.log("✓ Catálogo de insignias y logros registrado.");

  // 6. Migrar Usuarios y Competidores
  try {
    const db = await readDatabase();
    const allUsers = [...(db.users || []), ...competitorsToSeed];

    for (const u of allUsers) {
      await pool.query(
        `INSERT INTO users (id, name, password, role, avatar, points, streak_days, streak_protected, last_active_date, completed_challenges)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password = VALUES(password),
           role = VALUES(role),
           avatar = VALUES(avatar),
           points = VALUES(points),
           streak_days = VALUES(streak_days),
           streak_protected = VALUES(streak_protected)`,
        [
          u.id,
          u.name,
          u.password,
          u.role || "child",
          u.avatar || "astronaut",
          u.points || 0,
          u.streakDays || 0,
          u.streakProtected ? 1 : 0,
          u.lastActiveDate || null,
          u.completedChallenges || 0,
        ]
      );

      for (const activeDate of u.activeDays || []) {
        await pool.query(
          `INSERT IGNORE INTO user_active_days (user_id, active_date) VALUES (?, ?)`,
          [u.id, activeDate]
        );
      }

      for (const lessonKey of u.completedLessons || []) {
        await pool.query(
          `INSERT IGNORE INTO user_progress (user_id, lesson_key, completed, score) VALUES (?, ?, 1, 10)`,
          [u.id, lessonKey]
        );
      }
    }
    console.log("✓ Usuarios exploradores y competidores reales registrados en MySQL.");
  } catch (err) {
    console.warn("Aviso al migrar usuarios:", err.message);
  }

  console.log("==> ¡Inicialización dinámica en MySQL completada con éxito! 🎉");
  await pool.end();
}

initializeDatabase().catch((err) => {
  console.error("❌ Error fatal en initializeDatabase:", err);
  process.exit(1);
});
