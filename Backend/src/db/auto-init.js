import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/database.js";
import { config } from "../config/env.js";
import { activities, dailyChallenge, readDatabase } from "../data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const leaguesToSeed = [
  {
    id: "bronce",
    name: "Liga Bronce",
    description: "Inicia tu camino en la Liga de Exploradores.",
    promotion_text: "🥉 Alcanza 100 XP para ascender a la Liga Plata",
    countdown_text: "Temporada activa",
    min_points: 0,
  },
  {
    id: "plata",
    name: "Liga Plata",
    description: "Compite con exploradores en ascenso.",
    promotion_text: "🥈 Alcanza 250 XP para ascender a la Liga Oro",
    countdown_text: "Temporada activa",
    min_points: 100,
  },
  {
    id: "oro",
    name: "Liga Oro",
    description: "Compite con los mejores estudiantes.",
    promotion_text: "🥇 Alcanza 450 XP para ascender a la Liga Zafiro",
    countdown_text: "Temporada activa",
    min_points: 250,
  },
  {
    id: "zafiro",
    name: "Liga Zafiro",
    description: "Compite, aprende y sube de división.",
    promotion_text: "💎 Alcanza 700 XP para ascender a la Liga Rubí",
    countdown_text: "Temporada activa",
    min_points: 450,
  },
  {
    id: "rubi",
    name: "Liga Rubí",
    description: "Exploradores veteranos del conocimiento.",
    promotion_text: "🔮 Alcanza 1,000 XP para ascender a la Liga Esmeralda",
    countdown_text: "Temporada activa",
    min_points: 700,
  },
  {
    id: "esmeralda",
    name: "Liga Esmeralda",
    description: "Maestros del aprendizaje continuo.",
    promotion_text: "🌲 Alcanza 1,400 XP para ascender a la Liga Diamante",
    countdown_text: "Temporada activa",
    min_points: 1000,
  },
  {
    id: "diamante",
    name: "Liga Diamante",
    description: "La élite de los exploradores galácticos.",
    promotion_text: "💠 Alcanza 2,000 XP para ascender a la Liga Cósmica",
    countdown_text: "Temporada activa",
    min_points: 1400,
  },
  {
    id: "cosmica",
    name: "Liga Cósmica",
    description: "El trono de los sabios legendarios.",
    promotion_text: "👑 ¡Mantente en la cima del universo del saber!",
    countdown_text: "Campeones supremos",
    min_points: 2000,
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
    description: "Gana 100 puntos resolviendo retos matemáticos espaciales.",
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
  { id: "1", name: "Estudiante", password: "1234", role: "child", avatar: "astronaut", points: 250, streakDays: 3, streakProtected: true },
  { id: "2", name: "Sofía Espacial", password: "1234", role: "child", avatar: "👩🏻‍🚀", points: 540, streakDays: 15, streakProtected: true },
  { id: "3", name: "Lucas Cohete", password: "1234", role: "child", avatar: "🧑🏽‍🚀", points: 480, streakDays: 14, streakProtected: true },
  { id: "4", name: "Valeria Estrella", password: "1234", role: "child", avatar: "👩🏽", points: 390, streakDays: 9, streakProtected: false },
  { id: "5", name: "Mateo Cometa", password: "1234", role: "child", avatar: "🧒🏾", points: 350, streakDays: 8, streakProtected: false },
  { id: "6", name: "Mateo el Astronauta", password: "1234", role: "child", avatar: "🧑🏻‍🚀", points: 310, streakDays: 6, streakProtected: true },
  { id: "7", name: "Profesor Carlos", password: "1234", role: "adult", avatar: "👨‍🏫", points: 0, streakDays: 0, streakProtected: false },
];

export async function autoInitDatabase() {
  const engine = config.isPostgres ? "PostgreSQL" : "MySQL";
  console.log(`[AutoInit] Comprobando estado de la base de datos (${engine})...`);

  try {
    let hasUsers = false;
    if (config.isPostgres) {
      const [rows] = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';"
      );
      hasUsers = rows && rows.length > 0;
    } else {
      const [rows] = await pool.query("SHOW TABLES LIKE 'users';");
      hasUsers = rows && rows.length > 0;
    }

    if (!hasUsers) {
      console.log(`[AutoInit] La tabla 'users' no existe. Creando esquema completo en ${engine}...`);
      const schemaFile = config.isPostgres ? "schema.postgres.sql" : "schema.sql";
      const schemaPath = resolve(__dirname, schemaFile);
      const schemaSql = await readFile(schemaPath, "utf8");

      if (config.isPostgres && pool.raw) {
        await pool.raw.query(schemaSql);
      } else {
        const cleanSql = schemaSql.replace(/--.*$/gm, "");
        const queries = cleanSql
          .split(";")
          .map((q) => q.trim())
          .filter((q) => q.length > 0);

        for (const query of queries) {
          await pool.query(query);
        }
      }
      console.log(`[AutoInit] ✔ Esquema de tablas creado exitosamente.`);
    }

    // 1. Sembrar Reto Diario si no existe
    const [challengeRows] = await pool.query("SELECT COUNT(*) AS cnt FROM daily_challenges;");
    const challengeCount = Number(challengeRows[0]?.cnt || challengeRows[0]?.count || 0);
    if (challengeCount === 0) {
      console.log("[AutoInit] Sembrando reto diario...");
      await pool.query(
        `INSERT INTO daily_challenges (id, title, description, total_target)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), total_target = VALUES(total_target);`,
        [dailyChallenge.id, dailyChallenge.title, dailyChallenge.description, dailyChallenge.total]
      );
    }

    // 2. Sembrar Ligas (8 divisiones)
    const [leagueRows] = await pool.query("SELECT COUNT(*) AS cnt FROM leagues;");
    const leagueCount = Number(leagueRows[0]?.cnt || leagueRows[0]?.count || 0);
    if (leagueCount < leaguesToSeed.length) {
      console.log("[AutoInit] Sembrando las 8 ligas de QuestWorld...");
      for (const league of leaguesToSeed) {
        await pool.query(
          `INSERT INTO leagues (id, name, description, promotion_text, countdown_text, min_points)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             description = VALUES(description),
             promotion_text = VALUES(promotion_text),
             countdown_text = VALUES(countdown_text),
             min_points = VALUES(min_points);`,
          [league.id, league.name, league.description, league.promotion_text, league.countdown_text, league.min_points]
        );
      }
    }

    // 3. Sembrar Catálogo de Actividades
    const [activityRows] = await pool.query("SELECT COUNT(*) AS cnt FROM activities;");
    const activityCount = Number(activityRows[0]?.cnt || activityRows[0]?.count || 0);
    if (activityCount === 0) {
      console.log("[AutoInit] Sembrando catálogo de actividades...");
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
             answer_json = VALUES(answer_json);`,
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
    }

    // 4. Sembrar Catálogo de Logros
    const [achRows] = await pool.query("SELECT COUNT(*) AS cnt FROM achievements;");
    const achCount = Number(achRows[0]?.cnt || achRows[0]?.count || 0);
    if (achCount === 0) {
      console.log("[AutoInit] Sembrando insignias y logros...");
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
             points_reward = VALUES(points_reward);`,
          [ach.id, ach.title, ach.description, ach.icon, ach.category, ach.required_points, ach.required_streak, ach.points_reward]
        );
      }
    }

    // 5. Sembrar Usuarios Iniciales si la tabla de usuarios está vacía
    const [userRows] = await pool.query("SELECT COUNT(*) AS cnt FROM users;");
    const userCount = Number(userRows[0]?.cnt || userRows[0]?.count || 0);
    if (userCount === 0) {
      console.log("[AutoInit] Sembrando usuarios y competidores iniciales...");
      let initialUsers = [];
      try {
        const db = await readDatabase();
        initialUsers = [...(db.users || []), ...competitorsToSeed];
      } catch (_) {
        initialUsers = [
          { id: "1", name: "Estudiante", password: "1234", role: "child", avatar: "astronaut", points: 250, streakDays: 3, streakProtected: true },
          ...competitorsToSeed,
        ];
      }

      for (const u of initialUsers) {
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
             streak_protected = VALUES(streak_protected);`,
          [
            u.id,
            u.name,
            u.password,
            u.role || "child",
            u.avatar || "astronaut",
            u.points || 0,
            u.streakDays || 0,
            Boolean(u.streakProtected),
            u.lastActiveDate || null,
            u.completedChallenges || 0,
          ]
        );

        for (const activeDate of u.activeDays || []) {
          await pool.query(
            `INSERT IGNORE INTO user_active_days (user_id, active_date) VALUES (?, ?);`,
            [u.id, activeDate]
          );
        }

        for (const lessonKey of u.completedLessons || []) {
          await pool.query(
            `INSERT IGNORE INTO user_progress (user_id, lesson_key, completed, score) VALUES (?, ?, TRUE, 10);`,
            [u.id, lessonKey]
          );
        }
      }
    }

    console.log(`[AutoInit] ✔ Base de datos verificada y lista para servir peticiones.`);
  } catch (err) {
    console.error(`[AutoInit] ❌ Error durante la verificación/inicialización de la base de datos:`, err.message);
  }
}
