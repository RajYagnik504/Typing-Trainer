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
    # High-compatibility iframe loader with dynamic path probing for local vs cloud deployment
    components.html("""
        <iframe id="typing-app-frame" style="width:100%; height:98vh; border:none; background-color:#050505;" src=""></iframe>
        <script>
            const frame = document.getElementById('typing-app-frame');
            const paths = ['/app/static/index.html', '/static/index.html', './static/index.html'];
            let loaded = false;

            async function checkAndLoad() {
                for (let path of paths) {
                    try {
                        let res = await fetch(path);
                        if (res.ok) {
                            frame.src = path;
                            loaded = true;
                            break;
                        }
                    } catch (e) {
                        // ignore error and try next
                    }
                }
                if (!loaded) {
                    // Fallback to default cloud serving path
                    frame.src = '/app/static/index.html';
                }
            }
            checkAndLoad();
        </script>
    """, height=900)
st.markdown("<!-- end of layout -->", unsafe_allow_html=True)
