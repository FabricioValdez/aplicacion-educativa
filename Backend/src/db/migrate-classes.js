import { pool, testConnection } from "../config/database.js";

async function migrate() {
  console.log("==> Iniciando migración de Clases y Ejercicios...");
  await testConnection();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id VARCHAR(50) NOT NULL PRIMARY KEY,
      code VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      subject VARCHAR(50) NOT NULL DEFAULT 'general',
      teacher_id VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Tabla 'classes' creada exitosamente.");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id VARCHAR(50) NOT NULL,
      student_id VARCHAR(50) NOT NULL,
      points INT NOT NULL DEFAULT 0,
      joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_class_student (class_id, student_id),
      CONSTRAINT fk_class_students_class FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
      CONSTRAINT fk_class_students_user FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Tabla 'class_students' creada exitosamente.");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      teacher_id VARCHAR(50) NOT NULL,
      class_id VARCHAR(50) NULL,
      subject VARCHAR(50) NOT NULL,
      title VARCHAR(150) NOT NULL,
      question TEXT NOT NULL,
      options_json JSON NULL,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT NULL,
      points INT NOT NULL DEFAULT 10,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_custom_exercises_teacher FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Tabla 'custom_exercises' creada exitosamente.");

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
