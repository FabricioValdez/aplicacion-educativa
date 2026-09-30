import { pool } from "../config/database.js";

async function migrate() {
  console.log("=== Ejecutando migración de lecciones y dinámicas de ejercicios ===");
  try {
    // 1. Crear tabla custom_lessons si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_lessons (
        id VARCHAR(50) NOT NULL PRIMARY KEY,
        teacher_id VARCHAR(50) NOT NULL,
        class_id VARCHAR(50) NULL,
        subject VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT NULL,
        min_activities INT NOT NULL DEFAULT 10,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_custom_lessons_subject_class (subject, class_id),
        CONSTRAINT fk_custom_lessons_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔ Tabla custom_lessons lista.");

    // 2. Verificar columnas en custom_exercises
    const [cols] = await pool.query("SHOW COLUMNS FROM custom_exercises;");
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes("lesson_id")) {
      await pool.query(`
        ALTER TABLE custom_exercises 
        ADD COLUMN lesson_id VARCHAR(50) NULL AFTER class_id;
      `);
      console.log("✔ Columna lesson_id agregada a custom_exercises.");
    } else {
      console.log("✔ Columna lesson_id ya existía en custom_exercises.");
    }

    if (!colNames.includes("data_json")) {
      await pool.query(`
        ALTER TABLE custom_exercises 
        ADD COLUMN data_json JSON NULL AFTER explanation;
      `);
      console.log("✔ Columna data_json agregada a custom_exercises.");
    } else {
      console.log("✔ Columna data_json ya existía en custom_exercises.");
    }

    console.log("=== Migración completada exitosamente ===");
    process.exit(0);
  } catch (error) {
    console.error("Error en migración:", error);
    process.exit(1);
  }
}

migrate();
