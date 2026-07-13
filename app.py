from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 🔑 Configure API
genai.configure(api_key=os.getenv("API_KEY"))


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate-response", methods=["POST"])
def generate_response():

    data = request.get_json()
    user_message = data.get("message", "").lower()

    # ───────────── INSTANT RESPONSES ─────────────

    # Pomodoro
    if "pomodoro" in user_message:
        return jsonify({
            "response": """⏳ Pomodoro Plan:
25 min study + 5 min break × 4 sessions
Then take 20 min long break.
Repeat 2–3 cycles today."""
        })

    # GATE Plan
    elif "gate" in user_message:
        return jsonify({
            "response": """📚 30-Day GATE Plan:
Week 1: OS + DBMS
Week 2: CN + Digital Logic
Week 3: DSA
Week 4: TOC + Compiler
Last days: Revision + Mock tests"""
        })

    # Burnout
    elif "burnout" in user_message or "tired" in user_message:
        return jsonify({
            "response": """💙 Burnout Fix:
✔ Take rest today
✔ Sleep 7–8 hrs
✔ Light study tomorrow
✔ Start with small goals
✔ Use Pomodoro"""
        })

    # DSA
    elif "dsa" in user_message or "coding" in user_message:
        return jsonify({
            "response": """💻 DSA Topics:
Arrays, Strings
Linked List, Stack, Queue
Trees, Graphs
Dynamic Programming"""
        })

    # Study Plan (NEW)
    elif "study plan" in user_message or "schedule" in user_message:
        return jsonify({
            "response": """📅 Smart Study Plan:
Morning → Learn concepts
Afternoon → Practice problems
Evening → Revision
Night → Quick recap

🎯 Rule: 3 subjects/day max"""
        })

    # Exam Tips (NEW)
    elif "exam" in user_message or "trick" in user_message:
        return jsonify({
            "response": """🎯 Exam Tricks:
✔ Solve PYQs first
✔ Revise formulas daily
✔ Don't study new topics last day
✔ Time management is key
✔ Attempt easy questions first"""
        })

    # Random motivation (NEW)
    elif "motivate" in user_message or "lazy" in user_message:
        return jsonify({
            "response": """🔥 Motivation Boost:
Start with just 10 minutes.
Action creates motivation.
Small steps → Big success 🚀"""
        })

    # ───────────── AI FALLBACK ─────────────

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        response = model.generate_content(user_message)

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        })


if __name__ == "__main__":
    app.run(debug=True)