import cors from "cors";
import express from "express";
import { testConnection } from "./config/database.js";
import { config } from "./config/env.js";
import { autoInitDatabase } from "./db/auto-init.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import achievementRoutes from "./routes/achievement.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// Middlewares base
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.text({ type: "text/*" }));
app.use((req, _res, next) => {
  if (typeof req.body === "string" && req.body.trim().startsWith("{")) {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {}
  }
  next();
});

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - User: ${req.header("x-user-id")} - Body: ${JSON.stringify(req.body || {})}`);
  next();
});

// Verificación de estado del servicio
app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "questworld-backend" });
});

// Inicialización / migración bajo demanda
app.get("/api/init-db", async (_request, response) => {
  try {
    await autoInitDatabase();
    response.json({ ok: true, message: "Base de datos verificada e inicializada correctamente." });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
});

// Rutas modulares conectadas a MySQL
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api", exerciseRoutes);
app.use("/api/user", userRoutes);
app.use("/api", userRoutes); // Compatibilidad con /api/profile
app.use("/api", activityRoutes); // Retos y Actividades
app.use("/api/missions", leaderboardRoutes);
app.use("/api", leaderboardRoutes); // /api/leaderboard
app.use("/api/achievements", achievementRoutes);
app.use("/api/user/achievements", achievementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", lessonRoutes);

// Manejador para rutas no encontradas (404)
app.use((_request, response) => {
  response.status(404).json({ message: "Ruta no encontrada." });
});

// Manejador centralizado de errores (500)
app.use(errorHandler);

app.listen(config.port, async () => {
  console.log(`QuestWorld API escuchando en el puerto ${config.port}`);
  const connected = await testConnection();
  if (connected) {
    await autoInitDatabase();
  }
});

