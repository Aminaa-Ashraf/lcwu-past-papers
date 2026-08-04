-- LCWU Past Papers — MySQL schema (Aiven)
-- Safe to re-run: uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teacher_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  semester TINYINT UNSIGNED NOT NULL,
  department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_courses_semester (semester),
  FULLTEXT INDEX ft_courses_name (name, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_aliases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  alias VARCHAR(100) NOT NULL,
  CONSTRAINT fk_alias_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_course_alias (course_id, alias),
  INDEX idx_alias (alias),
  FULLTEXT INDEX ft_aliases_alias (alias)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS papers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  year SMALLINT UNSIGNED NOT NULL,
  exam_type ENUM('mid', 'final', 'quiz', 'assignment', 'other') NOT NULL DEFAULT 'mid',
  teacher_id INT UNSIGNED NULL,
  teacher VARCHAR(255) NULL,
  file_url VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  uploaded_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paper_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_paper_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_paper_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON DELETE SET NULL,
  INDEX idx_papers_course_year (course_id, year),
  INDEX idx_papers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
