import streamlit as st
import streamlit.components.v1 as components
import os
import shutil

# Set page config
st.set_page_config(
    page_title="AI Typing Intelligence & Writing Performance Platform",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Define paths
dist_dir = os.path.join(os.path.dirname(__file__), "dist")
static_dir = os.path.join(os.path.dirname(__file__), "static")

# Sync build files to static directory for Streamlit static serving
if os.path.exists(dist_dir):
    if os.path.exists(static_dir):
        try:
            shutil.rmtree(static_dir)
        except Exception:
            pass
    try:
        shutil.copytree(dist_dir, static_dir)
    except Exception as e:
        st.warning(f"Note on copy: {e}")

# Hide Streamlit header/footer/menu for immersive dashboard cockpit styling
hide_style = """
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0rem; margin: 0rem;}
    iframe {border: none; width: 100%; height: 98vh;}
    body {background-color: #050505;}
    </style>
"""
st.markdown(hide_style, unsafe_allow_html=True)

# Verify if compiled assets exist
if not os.path.exists(os.path.join(static_dir, "index.html")):
    st.error("⚙️ Application build not found. Please compile the frontend before launching.")
    st.info("Run `npm run build` in the terminal to compile assets to the `dist/` directory.")
else:
    # Direct iframe rendering using Streamlit's official components.iframe
    # Probes if running in Streamlit Cloud vs local deployment
    is_cloud = "STREAMLIT_SHARING_MODE" in os.environ or "/app/" in os.path.abspath(__file__)
    src_url = "/app/static/index.html" if is_cloud else "/app/static/index.html"

    components.iframe(src=src_url, height=950, scrolling=True)
st.markdown("<!-- end of layout -->", unsafe_allow_html=True)
