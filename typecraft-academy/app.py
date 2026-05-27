import streamlit as st
import os
import pandas as pd
import random
import json
from datetime import datetime

# Import database and ML model
import database
import ml_model

# Page config
st.set_page_config(
    page_title="Typecraft Academy — Premium Touch Typing & Cognitive Platform",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize database
database.init_db()

# Custom CSS Injection for Premium Dark Neon Theme
theme_css = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
    
    /* Full Page Background */
    html, body, [data-testid="stAppViewContainer"] {
        background: radial-gradient(circle at 50% 50%, #0b0f19 0%, #050810 100%) !important;
        color: #E2E8F0 !important;
        font-family: 'Inter', sans-serif !important;
    }
    
    [data-testid="stHeader"] {
        background: transparent !important;
    }
    
    /* Neon Headings */
    h1, h2, h3, .title-neon {
        font-family: 'Orbitron', sans-serif !important;
        font-weight: 700;
        color: #FFFFFF !important;
        text-shadow: 0 0 10px rgba(127, 119, 221, 0.55), 0 0 20px rgba(127, 119, 221, 0.25) !important;
        letter-spacing: 0.05em;
    }
    
    /* Custom Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: rgba(5, 8, 16, 0.95) !important;
        border-right: 1px solid rgba(127, 119, 221, 0.15) !important;
    }
    
    /* Glassmorphism Cards */
    .glass-card {
        background: rgba(13, 20, 38, 0.45) !important;
        border: 1px solid rgba(127, 119, 221, 0.15) !important;
        border-radius: 16px !important;
        padding: 24px !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        margin-bottom: 20px !important;
        transition: all 0.3s ease;
    }
    
    .glass-card:hover {
        border-color: rgba(29, 158, 117, 0.3) !important;
        box-shadow: 0 8px 32px 0 rgba(29, 158, 117, 0.1) !important;
    }
    
    .stat-card {
        text-align: center;
        padding: 16px !important;
    }
    
    .stat-label {
        font-size: 0.8rem;
        text-transform: uppercase;
        color: #94A3B8;
        letter-spacing: 0.1em;
        margin-bottom: 4px;
        font-weight: 600;
    }
    
    .stat-val {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: #1D9E75;
        text-shadow: 0 0 8px rgba(29, 158, 117, 0.3);
    }
    
    .stat-val.purple-text {
        color: #7F77DD;
        text-shadow: 0 0 8px rgba(127, 119, 221, 0.3);
    }
    
    /* Neon Styled Buttons */
    div.stButton > button {
        background: linear-gradient(135deg, #7F77DD 0%, #685cc7 100%) !important;
        color: #FFFFFF !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 8px !important;
        padding: 10px 24px !important;
        font-family: 'Orbitron', sans-serif !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        letter-spacing: 0.05em !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 4px 15px rgba(127, 119, 221, 0.35) !important;
        width: 100%;
        margin-top: 5px;
    }
    
    div.stButton > button:hover {
        background: linear-gradient(135deg, #1D9E75 0%, #158562 100%) !important;
        box-shadow: 0 4px 15px rgba(29, 158, 117, 0.45) !important;
        transform: translateY(-2px) !important;
        color: #FFFFFF !important;
    }
    
    /* Secondary Style Customizations */
    .badge-icon {
        font-size: 2.2rem;
        margin-bottom: 6px;
    }
    .badge-title {
        font-weight: 700;
        font-size: 0.85rem;
        color: #FFFFFF;
    }
    .badge-desc {
        font-size: 0.7rem;
        color: #94A3B8;
    }
    
    /* Table modifications */
    [data-testid="stTable"] {
        background: rgba(13, 20, 38, 0.2) !important;
        border-radius: 12px !important;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    
    /* Hide Streamlit default marks */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Printing Layout Hacks */
    @media print {
        body * {
            visibility: hidden;
        }
        #printableReportCard, #printableReportCard * {
            visibility: visible;
        }
        #printableReportCard {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #FFFFFF !important;
            color: #000000 !important;
            padding: 30px;
        }
        .report-header, .report-section, .report-footer {
            color: #000000 !important;
            border-color: #CCCCCC !important;
        }
    }
</style>
"""
st.markdown(theme_css, unsafe_allow_html=True)

# Declare bidirectional typing component
parent_dir = os.path.dirname(os.path.abspath(__file__))
component_dir = os.path.join(parent_dir, "assets", "typing_component")
typing_component = st.components.v1.declare_component("typing_component", path=component_dir)

# Initialize Session State variables
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'user_role' not in st.session_state:
    st.session_state.user_role = None  # 'student' or 'teacher'
if 'student_id' not in st.session_state:
    st.session_state.student_id = None
if 'student_name' not in st.session_state:
    st.session_state.student_name = ""
if 'classroom_code' not in st.session_state:
    st.session_state.classroom_code = ""
if 'active_tab' not in st.session_state:
    st.session_state.active_tab = "Home"

# ----------------- LESSON CURRICULUM DEFINITIONS -----------------
LESSONS = {
    1: {
        "title": "Home Row Keys",
        "keys": "A S D F J K L ;",
        "exercises": [
            {"title": "Home Row Basics", "prompt": "asdf jkl; asdf jkl; asdf jkl;"},
            {"title": "Home Row Alternating", "prompt": "a;s l d k f j a;s l d k f j"},
            {"title": "Fluid Word Flows", "prompt": "fall lads flask glass salad alfalfa"}
        ]
    },
    2: {
        "title": "Top Row Keys",
        "keys": "Q W E R T Y U I O P",
        "exercises": [
            {"title": "Top Row Basics", "prompt": "qwer uiop qwer uiop qwer uiop"},
            {"title": "Top Row Word drills", "prompt": "pour riot quiet write power output"},
            {"title": "Home-Top Coordination", "prompt": "tutor route pride wipe outer turtle"}
        ]
    },
    3: {
        "title": "Bottom Row Keys",
        "keys": "Z X C V B N M , . /",
        "exercises": [
            {"title": "Bottom Row Basics", "prompt": "zxcv bnm, zxcv bnm, zxcv bnm,"},
            {"title": "Bottom Row Word drills", "prompt": "zoom curb zone cave verb cabin"},
            {"title": "Full Alphabet Flows", "prompt": "cab mob van box zero carbon crazy"}
        ]
    },
    4: {
        "title": "Full Keyboard Flow",
        "keys": "Mixed Alphabet & Space Coordination",
        "exercises": [
            {"title": "Basic Sentences", "prompt": "The quick brown fox jumps over the lazy dog."},
            {"title": "Fluid Rhythm Paragraph", "prompt": "Touch typing builds speed through muscle memory and rhythm."},
            {"title": "Accuracy Challenge", "prompt": "Accurate practice leads to flawless professional typing speed."}
        ]
    },
    5: {
        "title": "Numbers & Symbols",
        "keys": "1234567890 ! @ # $ % ^ & * ( ) _ +",
        "exercises": [
            {"title": "Number Row Drills", "prompt": "Level 123 is 45% faster than level 67890."},
            {"title": "Symbols Mastery", "prompt": "Code speed: (score * 2) >= 100 || error == 0;"},
            {"title": "Developer Syntax Mock", "prompt": "contact@typecraft.edu | url: https://typecraft.edu/"}
        ]
    }
}

BADGES_META = {
    "First 30 WPM": {"icon": "🥉", "desc": "Achieve 30 WPM or more on any exercise"},
    "Speed Demon": {"icon": "⚡", "desc": "Achieve 60 WPM or more on any exercise"},
    "Accuracy Master": {"icon": "🎯", "desc": "Complete any exercise with 98% or higher accuracy"},
    "XP Gladiator": {"icon": "👑", "desc": "Accumulate 500 XP or higher"},
    "Daily Dedication": {"icon": "📅", "desc": "Complete a Daily Drill session"}
}

# ----------------- STUDENT COMPLETED STATUS AND LOCKS -----------------
def get_unlocked_status(student_id):
    sessions = database.get_student_sessions(student_id)
    completed = set()
    for s in sessions:
        completed.add((s["lesson_level"], s["exercise_index"]))
        
    unlocked = {}
    for level in LESSONS:
        unlocked[level] = {}
        for ex in range(1, 4):
            if level == 1 and ex == 1:
                unlocked[level][ex] = True
            elif ex > 1:
                # Unlocked if the previous exercise in the same level is completed
                unlocked[level][ex] = (level, ex - 1) in completed
            else:
                # Exercise 1 of level > 1 is unlocked if exercise 3 of level - 1 is completed
                unlocked[level][ex] = (level - 1, 3) in completed
    return unlocked, completed

# ----------------- LANDING PAGE VIEW -----------------
def render_landing_page():
    st.markdown("""
    <div style="text-align: center; padding: 40px 20px;">
        <h1 style="font-size: 3.5rem; margin-bottom: 10px; font-family: 'Orbitron', sans-serif;">TYPECRAFT ACADEMY</h1>
        <p style="font-size: 1.3rem; color: #94A3B8; font-weight: 300; max-width: 700px; margin: 0 auto 30px auto;">
            The Flagship AI-Powered Typing Intelligence & Writing Performance Platform for Schools, Coaching Centers, and Advanced Typists.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("""
        <div class="glass-card" style="text-align: center; padding: 30px;">
            <h3 style="margin-bottom: 20px; text-transform: uppercase;">Portal Entrance</h3>
        </div>
        """, unsafe_allow_html=True)
        
        entry_mode = st.radio("Choose Entry Mode", ["Student Access", "Teacher Portal"], horizontal=True)
        
        if entry_mode == "Student Access":
            st.markdown("<p style='font-size:0.85rem; color:#94A3B8;'>Join your class code to track progress, earn rewards, and access homework assignments.</p>", unsafe_allow_html=True)
            name = st.text_input("Enter Your Name")
            code = st.text_input("Enter Classroom Code (e.g. TC-XXXX)").upper()
            
            if st.button("Enter Classroom"):
                if name.strip() == "" or code.strip() == "":
                    st.error("Please fill in both name and classroom code.")
                else:
                    classroom = database.get_classroom(code)
                    if not classroom:
                        st.error("Classroom code not found. Check with your teacher.")
                    else:
                        student = database.get_student_by_name_and_class(name, code)
                        if not student:
                            # Auto register student to classroom
                            student_id = database.add_student(name, code)
                            student = database.get_student(student_id)
                            st.success(f"Registered & Logged in as {name}!")
                        else:
                            st.success(f"Welcome back, {name}!")
                        
                        st.session_state.logged_in = True
                        st.session_state.user_role = "student"
                        st.session_state.student_id = student["id"]
                        st.session_state.student_name = student["name"]
                        st.session_state.classroom_code = student["classroom_code"]
                        st.session_state.active_tab = "Visual Curriculum"
                        st.rerun()
                        
        else:
            st.markdown("<p style='font-size:0.85rem; color:#94A3B8;'>Manage classrooms, view comprehensive progress graphs, and generate printable report cards.</p>", unsafe_allow_html=True)
            teacher_name = st.text_input("Enter Teacher Name", "Instructor Pro")
            passcode = st.text_input("Teacher Passcode (Default: teacher)", type="password")
            
            if st.button("Access Dashboard"):
                if passcode == "teacher":
                    st.session_state.logged_in = True
                    st.session_state.user_role = "teacher"
                    st.session_state.student_name = teacher_name
                    st.session_state.active_tab = "Classrooms Management"
                    st.success("Authenticated Successfully!")
                    st.rerun()
                else:
                    st.error("Incorrect Passcode.")
                    
    # Platform Highlights
    st.markdown("<br><br><h2 style='text-align:center; font-size:2rem; margin-bottom:30px;'>Engine Blueprint</h2>", unsafe_allow_html=True)
    h_col1, h_col2, h_col3 = st.columns(3)
    
    with h_col1:
        st.markdown("""
        <div class="glass-card" style="height: 250px;">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">📊</div>
            <h3 style="color:#7F77DD; font-size:1.15rem; margin-bottom:10px;">Teacher Analytics Cockpit</h3>
            <p style="font-size: 0.85rem; color: #94A3B8;">Full diagnostic charts, timelines of student speeds (WPM), accuracy, and exportable CSV lists for classroom management.</p>
        </div>
        """, unsafe_allow_html=True)
    with h_col2:
        st.markdown("""
        <div class="glass-card" style="height: 250px;">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">🧠</div>
            <h3 style="color:#1D9E75; font-size:1.15rem; margin-bottom:10px;">Cognitive Daily Drills</h3>
            <p style="font-size: 0.85rem; color: #94A3B8;">Adaptive logic auto-scans typing logs, highlights weak keystrokes, and shapes a unique 2-minute drill to eliminate muscle-memory errors.</p>
        </div>
        """, unsafe_allow_html=True)
    with h_col3:
        st.markdown("""
        <div class="glass-card" style="height: 250px;">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">🏆</div>
            <h3 style="color:#7F77DD; font-size:1.15rem; margin-bottom:10px;">Immersive Gamification</h3>
            <p style="font-size: 0.85rem; color: #94A3B8;">XP progression systems, sequential locks, achievement badges, and a live classroom leaderboard to trigger healthy competition.</p>
        </div>
        """, unsafe_allow_html=True)

# ----------------- STUDENT CURRICULUM ROADMAP VIEW -----------------
def render_student_curriculum():
    student = database.get_student(st.session_state.student_id)
    st.markdown(f"<h1 class='title-neon'>ROADMAP — Welcome back, {student['name']}</h1>", unsafe_allow_html=True)
    
    # HUD Stats Card
    stats_col1, stats_col2, stats_col3, stats_col4 = st.columns(4)
    sessions = database.get_student_sessions(student["id"])
    
    wpm_avg = 0
    acc_avg = 100
    if len(sessions) > 0:
        wpm_avg = round(sum(s["wpm"] for s in sessions) / len(sessions))
        acc_avg = round(sum(s["accuracy"] for s in sessions) / len(sessions))
        
    with stats_col1:
        st.markdown(f"""
        <div class="glass-card stat-card">
            <div class="stat-label">EXP Points</div>
            <div class="stat-val">{student['xp']} XP</div>
        </div>
        """, unsafe_allow_html=True)
    with stats_col2:
        st.markdown(f"""
        <div class="glass-card stat-card">
            <div class="stat-label">Typing Rank</div>
            <div class="stat-val purple-text">Lvl {student['level']}</div>
        </div>
        """, unsafe_allow_html=True)
    with stats_col3:
        st.markdown(f"""
        <div class="glass-card stat-card">
            <div class="stat-label">Avg Speed</div>
            <div class="stat-val">{wpm_avg} WPM</div>
        </div>
        """, unsafe_allow_html=True)
    with stats_col4:
        st.markdown(f"""
        <div class="glass-card stat-card">
            <div class="stat-label">Avg Accuracy</div>
            <div class="stat-val purple-text">{acc_avg}%</div>
        </div>
        """, unsafe_allow_html=True)

    # Get unlock grids
    unlocked, completed = get_unlocked_status(student["id"])
    
    # Layout the visual roadmap
    st.write("---")
    st.markdown("### 🗺️ Visual Curriculum Roadmap")
    
    for level_idx in LESSONS:
        lvl = LESSONS[level_idx]
        st.markdown(f"#### 🌐 Level {level_idx}: {lvl['title']} (`{lvl['keys']}`)")
        
        ex_cols = st.columns(3)
        for ex_idx, ex in enumerate(lvl["exercises"], 1):
            with ex_cols[ex_idx - 1]:
                is_unlocked = unlocked[level_idx][ex_idx]
                is_completed = (level_idx, ex_idx) in completed
                
                # Dynamic border status color
                status_color = "rgba(29, 158, 117, 0.4)" if is_completed else ("rgba(127, 119, 221, 0.4)" if is_unlocked else "rgba(255, 255, 255, 0.05)")
                
                st.markdown(f"""
                <div class="glass-card" style="border: 2px solid {status_color}; padding: 15px; min-height: 180px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; color:#94A3B8; font-weight:600;">EXERCISE {ex_idx}</span>
                        <span>{'✅' if is_completed else ('🔓' if is_unlocked else '🔒')}</span>
                    </div>
                    <h4 style="margin: 10px 0 5px 0; color:#FFFFFF;">{ex['title']}</h4>
                    <p style="font-size:0.75rem; color:#94A3B8; font-style:italic;">"{ex['prompt'][:25]}..."</p>
                </div>
                """, unsafe_allow_html=True)
                
                if is_unlocked:
                    if st.button("Start Lesson", key=f"btn_{level_idx}_{ex_idx}"):
                        st.session_state.active_tab = f"Practice_{level_idx}_{ex_idx}"
                        st.rerun()
                else:
                    st.button("Locked", disabled=True, key=f"btn_lock_{level_idx}_{ex_idx}")
        st.markdown("<br>", unsafe_allow_html=True)

# ----------------- TYPING PRACTICE VIEW -----------------
def render_typing_practice(level, exercise_index):
    student = database.get_student(st.session_state.student_id)
    level = int(level)
    exercise_index = int(exercise_index)
    
    exercise = LESSONS[level]["exercises"][exercise_index - 1]
    
    st.markdown(f"<h1 class='title-neon'>Level {level}: {LESSONS[level]['title']}</h1>", unsafe_allow_html=True)
    st.write(f"📝 **Exercise {exercise_index}: {exercise['title']}**")
    
    # Back to curriculum button
    if st.button("⬅️ Back to Curriculum"):
        st.session_state.active_tab = "Visual Curriculum"
        st.rerun()
        
    st.markdown("#### Typing Interface")
    # Render Bidirectional Custom Component
    result = typing_component(target_text=exercise["prompt"], key=f"practice_comp_{level}_{exercise_index}")
    
    if result is not None:
        # User finished the typing exercise!
        wpm = result.get("wpm", 0)
        accuracy = result.get("accuracy", 0)
        rhythm_score = result.get("rhythm_score", 0)
        errors = result.get("errors", [])
        
        # Guard session state rewrite loops
        session_key = f"saved_{level}_{exercise_index}"
        if session_key not in st.session_state:
            st.session_state[session_key] = True
            
            # Save stats to SQLite
            database.save_session(student["id"], level, exercise_index, wpm, accuracy, rhythm_score, errors)
            
            # Calculate XP: Base 50 XP + WPM + Accuracy factor
            xp_earned = 50 + int(wpm) + int(accuracy)
            new_xp = student["xp"] + xp_earned
            
            # Update user level (Level increases every 300 XP)
            new_level = 1 + (new_xp // 300)
            database.update_student_progress(student["id"], new_xp, new_level)
            
            # Badge checks & alerts
            badges_earned = []
            if wpm >= 30 and database.add_achievement(student["id"], "First 30 WPM"):
                badges_earned.append("First 30 WPM")
            if wpm >= 60 and database.add_achievement(student["id"], "Speed Demon"):
                badges_earned.append("Speed Demon")
            if accuracy >= 98 and database.add_achievement(student["id"], "Accuracy Master"):
                badges_earned.append("Accuracy Master")
            if new_xp >= 500 and database.add_achievement(student["id"], "XP Gladiator"):
                badges_earned.append("XP Gladiator")
                
            st.balloons()
            st.success(f"🎉 Exercise Complete! Earned **+{xp_earned} XP**!")
            
            # Display badges if earned
            for badge in badges_earned:
                st.info(f"🏆 Achievement Unlocked: **{badge}**!")
                
            st.markdown(f"""
            <div class="glass-card" style="margin-top: 15px; border-color: rgba(29, 158, 117, 0.4);">
                <h3 style="color:#1D9E75;">Session Summary</h3>
                <p>⚡ <b>Speed:</b> {wpm} WPM | 🎯 <b>Accuracy:</b> {accuracy}% | 🎵 <b>Rhythm Consistency:</b> {rhythm_score}%</p>
                <p>XP Level updated to: <b>Level {new_level}</b> ({new_xp} total XP).</p>
            </div>
            """, unsafe_allow_html=True)

# ----------------- DAILY DRILL VIEW -----------------
def render_daily_drill():
    student = database.get_student(st.session_state.student_id)
    st.markdown("<h1 class='title-neon'>COGNITIVE DAILY DRILL</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8;'>AI-Adaptive muscle training system. This module compiles your historical typing session errors, detects your weakest character sequences, and generates a focused drill to correct your hands.</p>", unsafe_allow_html=True)
    
    # Query errors from student session history
    sessions = database.get_student_sessions(student["id"])
    all_errors = {}
    
    for s in sessions:
        errs = s.get("errors", [])
        # Some DB engines might return it as JSON array or string
        if isinstance(errs, str):
            try:
                errs = json.loads(errs)
            except Exception:
                errs = []
        for char in errs:
            if char.strip() != "":
                all_errors[char] = all_errors.get(char, 0) + 1
                
    # Auto-detect weakest keys
    weak_keys = [k for k, v in sorted(all_errors.items(), key=lambda x: x[1], reverse=True)[:3]]
    
    if len(weak_keys) == 0:
        # Fallback to home row keys if no errors are registered yet
        weak_keys = ['a', 's', 'l']
        st.info("💡 No error history found yet! We have preloaded a foundational Home Row drill for you.")
    else:
        st.success(f"🎯 AI scan detected your weakest keys: **{', '.join(weak_keys).upper()}**")
        
    # Generate custom drill sentence (2 minutes targeted practice)
    # We will build words composed heavily of the weak keys
    words_bank = {
        'a': ['ash', 'alas', 'asks', 'fall', 'salad', 'flask', 'half', 'glass'],
        's': ['slash', 'sass', 'soils', 'sales', 'slack', 'spell', 'safe', 'skid'],
        'd': ['dial', 'deeds', 'drift', 'damp', 'dodge', 'dark', 'dawn', 'depth'],
        'f': ['flaw', 'fruit', 'flare', 'fight', 'floor', 'front', 'force', 'fluid'],
        'g': ['glow', 'glide', 'glass', 'gauge', 'grade', 'giant', 'ghost', 'globe'],
        'h': ['half', 'hatch', 'haste', 'heart', 'hover', 'heavy', 'horse', 'human'],
        'j': ['jack', 'jumps', 'juice', 'joint', 'jolly', 'judge', 'jewel', 'jungle'],
        'k': ['keys', 'kettle', 'knife', 'knead', 'kitty', 'knight', 'koala', 'kernel'],
        'l': ['laws', 'lads', 'lemon', 'liver', 'logic', 'light', 'laser', 'loyal'],
        ';': ['semi', 'colon', 'press', 'shift', 'enter', 'space', 'keys', 'type'],
        'q': ['quiet', 'quick', 'queen', 'quote', 'query', 'quest', 'quilt', 'quake'],
        'w': ['write', 'wheel', 'wrong', 'world', 'waste', 'water', 'winds', 'words'],
        'e': ['enter', 'eagle', 'earth', 'elbow', 'eight', 'event', 'extra', 'exist'],
        'r': ['rules', 'route', 'river', 'radar', 'radio', 'raise', 'react', 'rhythm'],
        't': ['tutor', 'track', 'timer', 'topic', 'train', 'table', 'total', 'truth'],
        'y': ['youth', 'yield', 'yacht', 'yeast', 'yawn', 'young', 'years', 'yellow'],
        'u': ['union', 'under', 'urban', 'uncle', 'usage', 'unite', 'utter', 'ultra'],
        'i': ['index', 'irony', 'image', 'input', 'idiom', 'issue', 'ivory', 'ideal'],
        'o': ['outer', 'onion', 'opera', 'orbit', 'order', 'ocean', 'olive', 'owner'],
        'p': ['power', 'paper', 'phase', 'photo', 'piano', 'plant', 'point', 'pulse'],
        'z': ['zoom', 'zebra', 'zones', 'zeros', 'zinc', 'zesty', 'zipper', 'zodiac'],
        'x': ['xenon', 'xray', 'index', 'excel', 'exact', 'oxide', 'extra', 'exotic'],
        'c': ['cabin', 'caves', 'curbs', 'cycle', 'clock', 'chart', 'cloud', 'crown'],
        'v': ['verbs', 'vanish', 'valves', 'voice', 'video', 'visit', 'vivid', 'vortex'],
        'b': ['basics', 'board', 'build', 'brush', 'beach', 'blend', 'blank', 'brave'],
        'n': ['nouns', 'nodes', 'night', 'novel', 'nurse', 'noise', 'naval', 'nexus'],
        'm': ['motor', 'music', 'mouth', 'maple', 'model', 'match', 'merit', 'magic']
    }
    
    drill_words = []
    # Pull words matching weak keys
    for k in weak_keys:
        if k in words_bank:
            drill_words.extend(random.sample(words_bank[k], min(len(words_bank[k]), 3)))
            
    # Shuffle and join
    random.shuffle(drill_words)
    drill_prompt = " ".join(drill_words)
    if len(drill_prompt) < 15:
        drill_prompt = "asdf jkl; asdf jkl;"
        
    st.markdown(f"""
    <div class="glass-card" style="border-left: 5px solid #1D9E75;">
        <h4>🔑 Practice Keys: {", ".join(weak_keys).upper()}</h4>
        <p style="font-size:0.9rem; color:#94A3B8; margin-top:5px;">A 2-minute drill is loaded inside the engine below. Focus on rhythm stability and finger positioning.</p>
    </div>
    """, unsafe_allow_html=True)

    # Render Typing Component
    result = typing_component(target_text=drill_prompt, key="daily_drill_component")
    
    if result is not None:
        wpm = result.get("wpm", 0)
        accuracy = result.get("accuracy", 0)
        rhythm_score = result.get("rhythm_score", 0)
        errors = result.get("errors", [])
        
        session_key = "saved_daily_drill"
        if session_key not in st.session_state:
            st.session_state[session_key] = True
            
            # Save session to SQLite
            database.save_session(student["id"], 0, 0, wpm, accuracy, rhythm_score, errors)
            
            # Award Daily Drill badge
            database.add_achievement(student["id"], "Daily Dedication")
            
            # Award XP: 75 XP flat bonus
            new_xp = student["xp"] + 75 + int(wpm)
            new_level = 1 + (new_xp // 300)
            database.update_student_progress(student["id"], new_xp, new_level)
            
            st.balloons()
            st.success(f"💪 Daily Drill Complete! XP level updated to Lvl {new_level}. Earned Flat +75 XP Daily Bonus!")
            
            st.markdown(f"""
            <div class="glass-card" style="margin-top: 15px; border-color: rgba(127, 119, 221, 0.4);">
                <h3 style="color:#7F77DD;">Drill Complete</h3>
                <p>Speed: {wpm} WPM | Accuracy: {accuracy}% | Rhythm Consistency: {rhythm_score}%</p>
                <p>🏆 <b>Daily Dedication</b> badge earned!</p>
            </div>
            """, unsafe_allow_html=True)

# ----------------- PROGRESS REPORT CARD VIEW -----------------
def render_progress_report_card():
    student = database.get_student(st.session_state.student_id)
    sessions = database.get_student_sessions(student["id"])
    achievements = database.get_student_achievements(student["id"])
    
    st.markdown("<h1 class='title-neon'>PROGRESS REPORT CARD</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8;'>View or print your certification dossier. Click 'Print Report' to print directly to PDF or paper.</p>", unsafe_allow_html=True)
    
    # Calculate stats
    wpm_avg = 0
    acc_avg = 100
    rhy_avg = 100
    highest_wpm = 0
    total_sessions = len(sessions)
    
    if total_sessions > 0:
        wpm_avg = round(sum(s["wpm"] for s in sessions) / total_sessions, 1)
        acc_avg = round(sum(s["accuracy"] for s in sessions) / total_sessions, 1)
        rhy_avg = round(sum(s["rhythm_score"] for s in sessions) / total_sessions, 1)
        highest_wpm = round(max(s["wpm"] for s in sessions))
        
    # Execute ML Classifier to predict skill badge
    skill_badge = ml_model.predict_skill_level(wpm_avg, acc_avg, rhy_avg)
    
    # Skill level styling based on prediction
    badge_colors = {
        "Beginner": "#94A3B8",
        "Intermediate": "#7F77DD",
        "Advanced": "#1D9E75",
        "Expert": "#FFD700"
    }
    badge_color = badge_colors.get(skill_badge, "#7F77DD")
    
    # Motivational Message
    if skill_badge == "Expert":
        message = "👑 Masterful! You have achieved elite touch typing control. Your speed, accuracy, and rhythm scores indicate complete finger independence."
    elif skill_badge == "Advanced":
        message = "🚀 Outstanding! You are typing at professional speeds. Focus on continuous flow to advance into the Expert tier."
    elif skill_badge == "Intermediate":
        message = "⚡ Good Job! You are moving past keyboard reliance. Keep practicing standard sentences to build a higher muscle-memory baseline."
    else:
        message = "🌱 Keep Going! Focus completely on key accuracy rather than speed. Speed will naturally emerge once layout accuracy reaches 95%."

    # Printable Card Container
    st.markdown(f"""
    <div id="printableReportCard" class="glass-card" style="border: 2px solid {badge_color}; max-width:850px; margin:0 auto; padding:35px; border-radius:18px;">
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px; margin-bottom:20px;">
            <div>
                <h2 style="margin:0; font-family:'Orbitron', sans-serif; font-size:1.8rem; color:#FFFFFF;">TYPECRAFT ACADEMY</h2>
                <span style="font-size:0.75rem; color:#94A3B8; text-transform:uppercase; letter-spacing:0.1em;">Official Competency Dossier</span>
            </div>
            <div style="text-align:right;">
                <div style="background:{badge_color}; color:#050810; padding:6px 14px; border-radius:30px; font-weight:800; font-family:'Orbitron', sans-serif; font-size:0.8rem; text-shadow:none;">
                    {skill_badge.upper()} CLASS
                </div>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; grid-gap:20px; margin-bottom:20px;">
            <div>
                <p style="margin:0; font-size:0.8rem; color:#94A3B8; text-transform:uppercase; font-weight:600;">Student Name</p>
                <h3 style="margin:2px 0 0 0; color:#FFFFFF; font-size:1.4rem;">{student['name']}</h3>
            </div>
            <div>
                <p style="margin:0; font-size:0.8rem; color:#94A3B8; text-transform:uppercase; font-weight:600;">Classroom Reference</p>
                <h3 style="margin:2px 0 0 0; color:#7F77DD; font-size:1.4rem; font-family:'Orbitron', sans-serif;">{student['classroom_code']}</h3>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); grid-gap:15px; background:rgba(0,0,0,0.2); padding:20px; border-radius:12px; border:1px solid rgba(255,255,255,0.03); margin-bottom:20px; text-align:center;">
            <div>
                <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; letter-spacing:0.05em;">Average Speed</div>
                <div style="font-size:1.8rem; font-weight:700; color:#1D9E75; font-family:'Orbitron', sans-serif; margin-top:5px;">{wpm_avg} <span style="font-size:0.8rem; font-weight:400; color:#94A3B8;">WPM</span></div>
            </div>
            <div>
                <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; letter-spacing:0.05em;">Peak Speed</div>
                <div style="font-size:1.8rem; font-weight:700; color:#7F77DD; font-family:'Orbitron', sans-serif; margin-top:5px;">{highest_wpm} <span style="font-size:0.8rem; font-weight:400; color:#94A3B8;">WPM</span></div>
            </div>
            <div>
                <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; letter-spacing:0.05em;">Accuracy</div>
                <div style="font-size:1.8rem; font-weight:700; color:#1D9E75; font-family:'Orbitron', sans-serif; margin-top:5px;">{acc_avg}%</div>
            </div>
            <div>
                <div style="font-size:0.7rem; color:#94A3B8; text-transform:uppercase; letter-spacing:0.05em;">Experience</div>
                <div style="font-size:1.8rem; font-weight:700; color:#7F77DD; font-family:'Orbitron', sans-serif; margin-top:5px;">{student['xp']} <span style="font-size:0.8rem; font-weight:400; color:#94A3B8;">XP</span></div>
            </div>
        </div>
        
        <div style="border-left:4px solid {badge_color}; padding-left:15px; margin-bottom:20px; font-style:italic; font-size:0.9rem; color:#E2E8F0;">
            {message}
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.write("<br>", unsafe_allow_html=True)
    
    # Progress Charts
    if total_sessions > 1:
        st.markdown("### 📈 Progression Metrics Timeline")
        df = pd.DataFrame(sessions)
        df["date"] = pd.to_datetime(df["date"])
        df = df.set_index("date")
        
        chart_col1, chart_col2 = st.columns(2)
        with chart_col1:
            st.markdown("##### WPM Speed Trend")
            st.line_chart(df["wpm"])
        with chart_col2:
            st.markdown("##### Accuracy (%) Trend")
            st.line_chart(df["accuracy"])
            
    # Achievements Grid
    st.markdown("### 🏆 Earned Achievements")
    if len(achievements) == 0:
        st.info("No achievement badges earned yet. Finish exercises and speed milestones to unlock badges!")
    else:
        ach_cols = st.columns(len(achievements) if len(achievements) < 5 else 5)
        for i, ach in enumerate(achievements):
            badge = ach["badge_name"]
            meta = BADGES_META.get(badge, {"icon": "🏅", "desc": "Earned"})
            with ach_cols[i % 5]:
                st.markdown(f"""
                <div class="glass-card stat-card" style="border-color: rgba(29, 158, 117, 0.25); min-height: 140px;">
                    <div class="badge-icon">{meta['icon']}</div>
                    <div class="badge-title">{badge}</div>
                    <div class="badge-desc">{meta['desc']}</div>
                </div>
                """, unsafe_allow_html=True)
                
    st.write("<br>", unsafe_allow_html=True)
    st.button("🖨️ Print Report Card", on_click=lambda: st.markdown("<script>window.print();</script>", unsafe_allow_html=True))

# ----------------- STUDENT LEADERBOARD VIEW -----------------
def render_student_leaderboard():
    student = database.get_student(st.session_state.student_id)
    st.markdown(f"<h1 class='title-neon'>CLASS LEADERBOARD</h1>", unsafe_allow_html=True)
    st.markdown(f"<p style='color:#94A3B8;'>Classroom Code: <b>{student['classroom_code']}</b>. View and compare performance metrics against peers.</p>", unsafe_allow_html=True)
    
    leaderboard = database.get_classroom_leaderboard(student["classroom_code"])
    
    if len(leaderboard) == 0:
        st.info("Classroom contains no student records.")
    else:
        df = pd.DataFrame(leaderboard)
        df.index = df.index + 1  # 1-indexed ranks
        df.columns = ["Student ID", "Name", "Total XP", "Level"]
        
        st.table(df[["Name", "Total XP", "Level"]])

# ----------------- TEACHER CLASSROOM MANAGEMENT VIEW -----------------
def render_teacher_dashboard():
    st.markdown("<h1 class='title-neon'>TEACHER PORTAL cockpit</h1>", unsafe_allow_html=True)
    
    tab1, tab2, tab3 = st.tabs(["Classrooms Admin", "Student Statistics", "CSV Exports"])
    
    with tab1:
        st.markdown("### Create New Classroom")
        c_name = st.text_input("Classroom Name", "Computing Grade 9")
        
        if st.button("Generate Classroom Code"):
            code = f"TC-{random.randint(1000, 9999)}"
            success = database.create_classroom(code, c_name, st.session_state.student_name)
            if success:
                st.success(f"Classroom **{c_name}** created successfully! Classroom Code: **{code}**")
            else:
                st.error("Error creating classroom code. Try again.")
                
        st.write("---")
        st.markdown("### Registered Classrooms")
        # List all classrooms in SQLite
        conn = database.get_db_connection()
        rows = conn.execute("SELECT * FROM classrooms WHERE teacher_name = ?", (st.session_state.student_name,)).fetchall()
        conn.close()
        
        if len(rows) == 0:
            st.info("You haven't registered any classrooms yet.")
        else:
            df = pd.DataFrame([dict(r) for r in rows])
            df.columns = ["Classroom Code", "Classroom Name", "Teacher Name"]
            st.table(df)
            
    with tab2:
        st.markdown("### View Student Performance")
        # Load all teacher's classrooms
        conn = database.get_db_connection()
        classes = conn.execute("SELECT code, name FROM classrooms WHERE teacher_name = ?", (st.session_state.student_name,)).fetchall()
        conn.close()
        
        if len(classes) == 0:
            st.info("Please create a classroom first.")
        else:
            class_dict = {f"{c['name']} ({c['code']})": c['code'] for c in classes}
            selected_class_label = st.selectbox("Select Classroom", list(class_dict.keys()))
            selected_code = class_dict[selected_class_label]
            
            # Query students in selected class
            students = database.get_classroom_students(selected_code)
            
            if len(students) == 0:
                st.info("No students registered in this class code yet. Ask your students to join using this code!")
            else:
                student_names = {s["name"]: s["id"] for s in students}
                selected_student_name = st.selectbox("Select Student Profile", list(student_names.keys()))
                student_id = student_names[selected_student_name]
                
                # Fetch student sessions
                s_profile = database.get_student(student_id)
                s_sessions = database.get_student_sessions(student_id)
                
                # Display metrics
                p_col1, p_col2, p_col3 = st.columns(3)
                with p_col1:
                    st.metric("Total Experience", f"{s_profile['xp']} XP")
                with p_col2:
                    st.metric("Current Rank", f"Lvl {s_profile['level']}")
                with p_col3:
                    st.metric("Exercises Practiced", len(s_sessions))
                    
                if len(s_sessions) > 0:
                    df_sess = pd.DataFrame(s_sessions)
                    df_sess = df_sess.rename(columns={
                        "lesson_level": "Level",
                        "exercise_index": "Exercise",
                        "wpm": "WPM Speed",
                        "accuracy": "Accuracy (%)",
                        "rhythm_score": "Rhythm Score (%)",
                        "date": "Date Completed"
                    })
                    
                    st.markdown("##### Progression History")
                    st.dataframe(df_sess[["Date Completed", "Level", "Exercise", "WPM Speed", "Accuracy (%)", "Rhythm Score (%)"]].set_index("Date Completed"))
                    
                    # WPM Progress Chart
                    st.markdown("##### WPM Progression Timeline")
                    chart_df = pd.DataFrame(s_sessions)
                    chart_df["date"] = pd.to_datetime(chart_df["date"])
                    chart_df = chart_df.set_index("date")
                    st.line_chart(chart_df["wpm"])
                else:
                    st.info("This student has not submitted any typing sessions yet.")
                    
    with tab3:
        st.markdown("### Export Student Data to CSV")
        # Load all classrooms
        conn = database.get_db_connection()
        classes = conn.execute("SELECT code, name FROM classrooms WHERE teacher_name = ?", (st.session_state.student_name,)).fetchall()
        conn.close()
        
        if len(classes) == 0:
            st.info("No classrooms available to export.")
        else:
            class_dict = {f"{c['name']} ({c['code']})": c['code'] for c in classes}
            export_class_label = st.selectbox("Select Classroom to Export", list(class_dict.keys()), key="export_class")
            export_code = class_dict[export_class_label]
            
            # Fetch all students and sessions for this class
            conn = database.get_db_connection()
            query = """
            SELECT s.name AS student_name, sess.lesson_level, sess.exercise_index, sess.wpm, sess.accuracy, sess.rhythm_score, sess.date
            FROM students s
            JOIN sessions sess ON s.id = sess.student_id
            WHERE s.classroom_code = ?
            ORDER BY sess.date DESC
            """
            rows = conn.execute(query, (export_code,)).fetchall()
            conn.close()
            
            if len(rows) == 0:
                st.info("No session records found to export for this class.")
            else:
                df_export = pd.DataFrame([dict(r) for r in rows])
                df_export.columns = ["Student Name", "Lesson Level", "Exercise Index", "WPM", "Accuracy (%)", "Rhythm Score (%)", "Date Completed"]
                
                st.dataframe(df_export)
                
                # CSV downloader button
                csv_data = df_export.to_csv(index=False)
                st.download_button(
                    label="📥 Download Data CSV",
                    data=csv_data,
                    file_name=f"{export_code}_student_records.csv",
                    mime="text/csv"
                )

# ----------------- MAIN NAVIGATION -----------------
def main():
    # Sidebar
    if st.session_state.logged_in:
        st.sidebar.markdown(f"<div style='text-align:center;'><h2 style='font-size:1.3rem;'>⚡ TYPECRAFT</h2><span style='color:#94A3B8; font-size:0.8rem;'>{st.session_state.student_name}</span></div><hr>", unsafe_allow_html=True)
        
        if st.session_state.user_role == "student":
            tabs = ["Visual Curriculum", "Daily Drill", "Report Card", "Leaderboard"]
        else:
            tabs = ["Classrooms Admin", "Teacher Analytics"]
            
        for tab in tabs:
            if st.sidebar.button(tab, key=f"sidebar_btn_{tab}"):
                st.session_state.active_tab = tab
                
        st.sidebar.write("<br><br>", unsafe_allow_html=True)
        if st.sidebar.button("🚪 Logout"):
            st.session_state.logged_in = False
            st.session_state.user_role = None
            st.session_state.student_id = None
            st.session_state.student_name = ""
            st.session_state.classroom_code = ""
            st.session_state.active_tab = "Home"
            st.rerun()
    else:
        st.sidebar.markdown("<div style='text-align:center;'><h2>⚡ TYPECRAFT</h2><span style='color:#94A3B8; font-size:0.8rem;'>Guest Profile</span></div>", unsafe_allow_html=True)
        
    # Render active views
    if not st.session_state.logged_in:
        render_landing_page()
    else:
        if st.session_state.active_tab == "Visual Curriculum":
            render_student_curriculum()
        elif st.session_state.active_tab == "Daily Drill":
            render_daily_drill()
        elif st.session_state.active_tab == "Report Card":
            render_progress_report_card()
        elif st.session_state.active_tab == "Leaderboard":
            render_student_leaderboard()
        elif st.session_state.active_tab == "Classrooms Admin":
            render_teacher_dashboard()
        elif st.session_state.active_tab == "Teacher Analytics":
            render_teacher_dashboard()
        elif st.session_state.active_tab.startswith("Practice_"):
            parts = st.session_state.active_tab.split("_")
            render_typing_practice(parts[1], parts[2])

if __name__ == "__main__":
    main()
