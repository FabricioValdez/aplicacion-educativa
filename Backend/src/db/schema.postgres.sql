-- Esquema DDL para PostgreSQL en Render - QuestWorld

-- 1. Tabla de Usuarios / Exploradores
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'child',
  avatar VARCHAR(50) NOT NULL DEFAULT 'astronaut',
  points INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  streak_protected BOOLEAN NOT NULL DEFAULT TRUE,
  streak_shields INT NOT NULL DEFAULT 2,
  has_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_date VARCHAR(10) NULL,
  completed_challenges INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_name_role ON users (name, role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users (points DESC);

-- 2. Historial de Días Activos (Calendario de Rachas)
CREATE TABLE IF NOT EXISTS user_active_days (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active_date VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date UNIQUE (user_id, active_date)
);

-- 3. Catálogo de Actividades y Lecciones
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(50) PRIMARY KEY,
  subject VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'Nivel 1',
  icon VARCHAR(20) NOT NULL DEFAULT '⭐',
  progress_label VARCHAR(50) NULL,
  progress_percent INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 10,
  content_json JSONB NOT NULL,
  answer_json JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Progreso de Lecciones por Usuario
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_key VARCHAR(50) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  score INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_key)
);

-- 5. Retos Diarios
CREATE TABLE IF NOT EXISTS daily_challenges (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  total_target INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Ligas y Divisiones de Misiones
CREATE TABLE IF NOT EXISTS leagues (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  promotion_text VARCHAR(255) NOT NULL,
  countdown_text VARCHAR(50) NOT NULL DEFAULT 'Termina en 2d 14h',
  min_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Catálogo de Logros e Insignias
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(20) NOT NULL DEFAULT '🏆',
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  required_points INT NOT NULL DEFAULT 0,
  required_streak INT NOT NULL DEFAULT 0,
  points_reward INT NOT NULL DEFAULT 20,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Logros Desbloqueados por Usuario
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- 9. Clases Escolares creadas por Docentes / Tutores
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  subject VARCHAR(50) NOT NULL DEFAULT 'general',
  teacher_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_code ON classes (code);

-- 10. Alumnos Inscritos por Clase y sus Puntos en Clase
CREATE TABLE IF NOT EXISTS class_students (
  id SERIAL PRIMARY KEY,
  class_id VARCHAR(50) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_class_student UNIQUE (class_id, student_id)
);

-- 11. Lecciones Creadas por Profesores
CREATE TABLE IF NOT EXISTS custom_lessons (
  id VARCHAR(50) PRIMARY KEY,
  teacher_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id VARCHAR(50) NULL,
  subject VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  min_activities INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_lessons_subject_class ON custom_lessons (subject, class_id);

-- 12. Ejercicios Personalizados creados por Profesores
CREATE TABLE IF NOT EXISTS custom_exercises (
  id SERIAL PRIMARY KEY,
  teacher_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id VARCHAR(50) NULL,
  lesson_id VARCHAR(50) NULL,
  subject VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  question TEXT NOT NULL,
  options_json JSONB NULL,
  correct_answer VARCHAR(255) NOT NULL,
  explanation TEXT NULL,
  data_json JSONB NULL,
  points INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
