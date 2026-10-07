import streamlit as st

st.set_page_config(
    page_title="NutriVision Info",
    page_icon="🍎",
    layout="wide",
)

st.title("NutriVision Information Website")
st.markdown("This project has been simplified to an informational calorie and nutrition website only.")
st.info("The fruit-prediction feature has been removed. Please use the frontend website for calorie information and healthy food guidance.")

st.markdown("---")

st.subheader("What this site includes")
st.markdown(
    "- Food calorie guidance\n"
    "- Healthy nutrition information\n"
    "- Lifestyle and diet education\n"
    "- General calorie awareness"
)

st.subheader("How to open the main website")
st.code("cd frontend && npm run dev -- --host 0.0.0.0 --port 4173")
