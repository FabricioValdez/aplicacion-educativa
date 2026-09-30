CREATE DATABASE IF NOT EXISTS `aplicacion-educativa`;
USE `aplicacion-educativa`;

-- 1. Tabla de Usuarios / Exploradores
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('child', 'adult') NOT NULL DEFAULT 'child',
  `avatar` VARCHAR(50) NOT NULL DEFAULT 'astronaut',
  `points` INT NOT NULL DEFAULT 0,
  `streak_days` INT NOT NULL DEFAULT 0,
  `streak_protected` BOOLEAN NOT NULL DEFAULT TRUE,
  `streak_shields` INT NOT NULL DEFAULT 2,
  `has_subscription` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_active_date` VARCHAR(10) NULL,
  `completed_challenges` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_name_role` (`name`, `role`),
  INDEX `idx_users_points` (`points` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Historial de Días Activos (Calendario de Rachas)
CREATE TABLE IF NOT EXISTS `user_active_days` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `active_date` VARCHAR(10) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_date` (`user_id`, `active_date`),
  CONSTRAINT `fk_active_days_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Catálogo de Actividades y Lecciones
CREATE TABLE IF NOT EXISTS `activities` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `subject` VARCHAR(50) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `level` VARCHAR(20) NOT NULL DEFAULT 'Nivel 1',
  `icon` VARCHAR(20) NOT NULL DEFAULT '⭐',
  `progress_label` VARCHAR(50) NULL,
  `progress_percent` INT NOT NULL DEFAULT 0,
  `points` INT NOT NULL DEFAULT 10,
  `content_json` JSON NOT NULL,
  `answer_json` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Progreso de Lecciones por Usuario
CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `lesson_key` VARCHAR(50) NOT NULL,
  `completed` BOOLEAN NOT NULL DEFAULT TRUE,
  `score` INT NOT NULL DEFAULT 0,
  `completed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_key`),
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Retos Diarios
CREATE TABLE IF NOT EXISTS `daily_challenges` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `total_target` INT NOT NULL DEFAULT 5,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Ligas y Divisiones de Misiones
CREATE TABLE IF NOT EXISTS `leagues` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `promotion_text` VARCHAR(255) NOT NULL,
  `countdown_text` VARCHAR(50) NOT NULL DEFAULT 'Termina en 2d 14h',
  `min_points` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Catálogo de Logros e Insignias
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(20) NOT NULL DEFAULT '🏆',
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `required_points` INT NOT NULL DEFAULT 0,
  `required_streak` INT NOT NULL DEFAULT 0,
  `points_reward` INT NOT NULL DEFAULT 20,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Logros Desbloqueados por Usuario
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `achievement_id` VARCHAR(50) NOT NULL,
  `unlocked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_achievement` (`user_id`, `achievement_id`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Clases Escolares creadas por Docentes / Tutores
CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `subject` VARCHAR(50) NOT NULL DEFAULT 'general',
  `teacher_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_classes_code` (`code`),
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Alumnos Inscritos por Clase y sus Puntos en Clase
CREATE TABLE IF NOT EXISTS `class_students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(50) NOT NULL,
  `student_id` VARCHAR(50) NOT NULL,
  `points` INT NOT NULL DEFAULT 0,
  `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_class_student` (`class_id`, `student_id`),
  CONSTRAINT `fk_class_students_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_class_students_user` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Lecciones Creadas por Profesores
CREATE TABLE IF NOT EXISTS `custom_lessons` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `teacher_id` VARCHAR(50) NOT NULL,
  `class_id` VARCHAR(50) NULL,
  `subject` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `min_activities` INT NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_custom_lessons_subject_class` (`subject`, `class_id`),
  CONSTRAINT `fk_custom_lessons_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Ejercicios Personalizados creados por Profesores
CREATE TABLE IF NOT EXISTS `custom_exercises` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` VARCHAR(50) NOT NULL,
  `class_id` VARCHAR(50) NULL,
  `lesson_id` VARCHAR(50) NULL,
  `subject` VARCHAR(50) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `question` TEXT NOT NULL,
  `options_json` JSON NULL,
  `correct_answer` VARCHAR(255) NOT NULL,
  `explanation` TEXT NULL,
  `data_json` JSON NULL,
  `points` INT NOT NULL DEFAULT 10,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_custom_exercises_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

