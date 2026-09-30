import fs from "node:fs";

// Cargar .env de forma segura en desarrollo local si existe el archivo
if (fs.existsSync(".env")) {
  try {
    process.loadEnvFile(".env");
  } catch (_) {}
}

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
const isPostgres = Boolean(databaseUrl || process.env.DB_ENGINE === "postgres");

export const config = {
  port: Number(process.env.PORT) || 4000,
  allowedOrigin: process.env.FRONTEND_URL || "http://localhost:5173",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || null,
  mockPayments: !process.env.STRIPE_SECRET_KEY,
  isPostgres,
  databaseUrl,
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3308,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "aplicacion-educativa",
  },
};

