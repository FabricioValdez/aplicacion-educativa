import mysql from "mysql2/promise";
import { config } from "./env.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Conexión establecida exitosamente con "${config.db.database}" en ${config.db.host}:${config.db.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("[MySQL] Error de conexión:", error.message);
    return false;
  }
}
