# ⚡ TYPECRAFT ACADEMY — Premium Typing Intelligence & Cognitive platform

Typecraft Academy is a flagship touch typing tuition platform designed for schools, coaching centers, and individual students. It combines real-time client-side keyboard analytics, a sequential gaming visual roadmap, an AI-adaptive Daily Drill error-correction system, gamified badges, a live classroom leaderboard, and a Machine Learning skill level classification engine.

---

## 🚀 Key Features

### 1. Teacher Dashboard & Administration
- **Classroom Architect**: Teachers can spawn custom classrooms with unique entry codes (e.g. `TC-8742`).
- **Student Progress Cockpit**: Timelines showing WPM speeds, accuracy curves, and rhythm consistency over time.
- **CSV Data Exporter**: Export all student marks, milestones, and session details in one click.

### 2. Gamified Visual Curriculum & Roadmaps
- **Unlock System**: 5 sequential typing levels spanning the home row, top row, bottom row, full alphanumeric keys, and symbol groups. Each level contains 3 locked exercises that open sequentially.
- **Interactive Typing Engine**: A HTML5/JS bidirectional client-side typing sandbox with microsecond timing capturing accuracy, speed (WPM), and standard deviation rhythm consistency.
- **XP Progression & Level Ranks**: Earn XP for finishing exercises, level up, and unlock achievements.
- **Achievements Badges**: Speed Demon, Accuracy Master, XP Gladiator, and Daily Dedication.

### 3. AI-Adaptive Daily Drills
- **Historical Analysis**: Scans student's error history logs.
- **Weak Key Targeting**: Dynamically builds custom 2-minute drills focusing on words that contain the student's top three weakest keys.

### 4. Progress Report Cards
- **ML Skill Level Badge**: Employs a Random Forest classification model matching average WPM, accuracy, and rhythm scores to skill classes: `Beginner`, `Intermediate`, `Advanced`, or `Expert`.
- **Dossier & Printable Dossier Card**: Beautiful certificate layouts complete with custom motivational summaries and streak indicators.

---

## 🛠️ Technology Blueprint

- **Core UI**: Python + Streamlit Natively
- **Frontend Sandbox**: HTML5 + CSS3 + Vanilla JavaScript Bidirectional custom component
- **Data Layer**: SQLite Database (`typecraft.db`)
- **Intelligence Core**: Scikit-Learn `RandomForestClassifier`
- **Analytics Visuals**: Pandas + Streamlit Native Charts

---

## 📦 Getting Started & Installation

### 1. Install Dependencies
Make sure you have Python 3.8+ installed. Navigate to this directory and install the packages:
```bash
pip install -r requirements.txt
```

### 2. Launch the Application
Start the Streamlit application:
```bash
streamlit run app.py
```
A browser tab will automatically open at `http://localhost:8501`.

---

## 📁 Repository Structure
```text
typecraft-academy/
├── app.py                     # Main Streamlit UI, routing & styles
├── database.py                # Database connection, schemas & query functions
├── ml_model.py                # RandomForestClassifier & rule fallback
├── requirements.txt           # Python package requirements
├── README.md                  # This setup documentation
└── assets/
    └── typing_component/
        └── index.html         # Custom HTML5/JS client-side typing component
```
