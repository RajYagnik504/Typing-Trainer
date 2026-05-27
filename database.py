import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "typecraft.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Classrooms Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS classrooms (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        teacher_name TEXT NOT NULL
    )
    """)
    
    # Students Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        classroom_code TEXT,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        FOREIGN KEY (classroom_code) REFERENCES classrooms(code)
    )
    """)
    
    # Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        lesson_level INTEGER,
        exercise_index INTEGER,
        wpm REAL,
        accuracy REAL,
        rhythm_score REAL,
        errors TEXT, -- JSON array of keys with errors
        date TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)
    
    # Achievements Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        badge_name TEXT NOT NULL,
        date_earned TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)
    
    conn.commit()
    conn.close()

# Classroom CRUD
def create_classroom(code, name, teacher_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO classrooms (code, name, teacher_name) VALUES (?, ?, ?)",
            (code.upper(), name, teacher_name)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_classroom(code):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM classrooms WHERE code = ?", (code.upper(),)).fetchone()
    conn.close()
    return dict(row) if row else None

# Student CRUD
def add_student(name, classroom_code):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO students (name, classroom_code) VALUES (?, ?)",
        (name.strip(), classroom_code.upper() if classroom_code else None)
    )
    student_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return student_id

def get_student(student_id):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_student_by_name_and_class(name, classroom_code):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM students WHERE UPPER(name) = UPPER(?) AND UPPER(classroom_code) = UPPER(?)",
        (name.strip(), classroom_code.strip())
    ).fetchone()
    conn.close()
    return dict(row) if row else None

def get_classroom_students(classroom_code):
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM students WHERE UPPER(classroom_code) = UPPER(?) ORDER BY xp DESC",
        (classroom_code.upper(),)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_student_progress(student_id, xp, level):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE students SET xp = ?, level = ? WHERE id = ?",
        (xp, level, student_id)
    )
    conn.commit()
    conn.close()

# Session Records
def save_session(student_id, lesson_level, exercise_index, wpm, accuracy, rhythm_score, errors):
    conn = get_db_connection()
    cursor = conn.cursor()
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    errors_str = json.dumps(errors) if isinstance(errors, (list, dict)) else errors
    cursor.execute(
        """
        INSERT INTO sessions (student_id, lesson_level, exercise_index, wpm, accuracy, rhythm_score, errors, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (student_id, lesson_level, exercise_index, wpm, accuracy, rhythm_score, errors_str, date_str)
    )
    conn.commit()
    conn.close()

def get_student_sessions(student_id):
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM sessions WHERE student_id = ? ORDER BY date ASC",
        (student_id,)
    ).fetchall()
    conn.close()
    sessions = []
    for row in rows:
        d = dict(row)
        try:
            d["errors"] = json.loads(d["errors"])
        except Exception:
            pass
        sessions.append(d)
    return sessions

# Achievements
def add_achievement(student_id, badge_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if they already have it
    existing = cursor.execute(
        "SELECT id FROM achievements WHERE student_id = ? AND badge_name = ?",
        (student_id, badge_name)
    ).fetchone()
    
    if not existing:
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            "INSERT INTO achievements (student_id, badge_name, date_earned) VALUES (?, ?, ?)",
            (student_id, badge_name, date_str)
        )
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def get_student_achievements(student_id):
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM achievements WHERE student_id = ? ORDER BY date_earned DESC",
        (student_id,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]

# Leaderboard
def get_classroom_leaderboard(classroom_code):
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT id, name, xp, level 
        FROM students 
        WHERE UPPER(classroom_code) = UPPER(?) 
        ORDER BY xp DESC 
        LIMIT 10
        """,
        (classroom_code.upper(),)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]
