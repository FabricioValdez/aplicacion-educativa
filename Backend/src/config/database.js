import mysql from "mysql2/promise";
import pg from "pg";
import { config } from "./env.js";

let poolInstance = null;

if (config.isPostgres) {
  const isLocal =
    config.databaseUrl &&
    (config.databaseUrl.includes("localhost") || config.databaseUrl.includes("127.0.0.1"));

  const pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  function translateSqlForPostgres(sql) {
    let text = sql;

    // 1. Manejo de INSERT IGNORE INTO
    if (/INSERT\s+IGNORE\s+INTO/i.test(text)) {
      text = text.replace(/INSERT\s+IGNORE\s+INTO/i, "INSERT INTO");
      if (!/ON\s+CONFLICT/i.test(text)) {
        text = text.replace(/;?\s*$/, " ON CONFLICT DO NOTHING;");
      }
    }

    // 2. Manejo de ON DUPLICATE KEY UPDATE
    if (/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(text)) {
      const tableMatch = text.match(/INSERT\s+INTO\s+([a-zA-Z0-9_`"]+)/i);
      const tableName = tableMatch ? tableMatch[1].replace(/[`"]/g, "").toLowerCase() : "";

      let conflictTarget = "(id)";
      if (tableName === "user_progress") {
        conflictTarget = "(user_id, lesson_key)";
      } else if (tableName === "user_active_days") {
        conflictTarget = "(user_id, active_date)";
      } else if (tableName === "user_achievements") {
        conflictTarget = "(user_id, achievement_id)";
      } else if (tableName === "class_students") {
        conflictTarget = "(class_id, student_id)";
      }

      text = text.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/i, `ON CONFLICT ${conflictTarget} DO UPDATE SET`);
      text = text.replace(/VALUES\s*\(\s*([a-zA-Z0-9_`"]+)\s*\)/gi, "EXCLUDED.$1");
    }

    // 3. Manejo de AUTO_INCREMENT id en INSERTs (ej. custom_exercises, class_students)
    if (/INSERT\s+INTO\s+(custom_exercises|class_students|user_progress|user_active_days)/i.test(text)) {
      if (!/RETURNING/i.test(text)) {
        text = text.replace(/;?\s*$/, " RETURNING id;");
      }
    }

    // 4. Transformar placeholders '?' en '$1, $2, ...'
    let paramIndex = 1;
    text = text.replace(/\?/g, () => `$${paramIndex++}`);

    // 5. Limpiar comillas invertidas de MySQL `columna` -> "columna" o columna
    text = text.replace(/`([a-zA-Z0-9_]+)`/g, '"$1"');

    return text;
  }

  poolInstance = {
    isPostgres: true,
    raw: pgPool,
    async query(sql, params = []) {
      const isPlainSql = typeof sql === "string";
      if (!isPlainSql) {
        return pgPool.query(sql, params);
      }

      const translatedSql = translateSqlForPostgres(sql);
      const result = await pgPool.query(translatedSql, params);

      const trimmedUpper = sql.trim().toUpperCase();
      const isSelect = trimmedUpper.startsWith("SELECT") || trimmedUpper.startsWith("WITH");

      if (isSelect) {
        return [result.rows, result.fields];
      }

      const insertId = result.rows?.[0]?.id || 0;
      const header = {
        affectedRows: result.rowCount || 0,
        insertId,
        rowCount: result.rowCount || 0,
        rows: result.rows,
      };
      return [header, result.fields];
    },
    async getConnection() {
      const client = await pgPool.connect();
      return {
        query: (sql, params) => poolInstance.query(sql, params),
        release: () => client.release(),
      };
    },
    async end() {
      return pgPool.end();
    },
  };
} else {
  const mysqlPool = mysql.createPool({
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

  poolInstance = {
    isPostgres: false,
    raw: mysqlPool,
    query: (...args) => mysqlPool.query(...args),
    execute: (...args) => mysqlPool.execute(...args),
    getConnection: () => mysqlPool.getConnection(),
    end: () => mysqlPool.end(),
  };
}

export const pool = poolInstance;

export async function testConnection() {
  try {
    if (config.isPostgres) {
      const client = await pool.getConnection();
      console.log(
        `[PostgreSQL] Conexión establecida exitosamente en ${
          config.databaseUrl ? config.databaseUrl.replace(/:[^:@]*@/, ":****@") : "Render"
        }`
      );
      client.release();
      return true;
    }

    const connection = await pool.getConnection();
    console.log(
      `[MySQL] Conexión establecida exitosamente con "${config.db.database}" en ${config.db.host}:${config.db.port}`
    );
    connection.release();
    return true;
  } catch (error) {
    const engine = config.isPostgres ? "PostgreSQL" : "MySQL";
    console.error(`[${engine}] Error de conexión:`, error.message);
    return false;
  }
}
