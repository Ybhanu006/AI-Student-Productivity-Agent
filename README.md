# ✦ Nova — AI Student Productivity Agent

A **full-stack AI-powered web application** built with **Python Flask** and **IBM watsonx.ai** that helps students manage tasks, stay focused, and receive intelligent study guidance through a conversational AI tutor.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 AI Chat | Conversational study companion powered by IBM Granite |
| 📋 Task Manager | Add, prioritise (High/Med/Low), complete, and filter tasks |
| ⏱️ Pomodoro Timer | 25-min focus, short/long breaks, 50-min deep work mode |
| 📊 Dashboard | Tasks completed, focus minutes, 7-day bars, day streak |
| 💡 AI Tips | One-click GATE plan, DSA roadmap, burnout recovery & more |
| 🌙 Dark Mode | Persisted theme preference |
| 🔥 Streak Tracker | Daily activity streak based on tasks + focus sessions |
| 📱 Responsive | Works on mobile, tablet, and desktop |

---

## 📁 Project Structure

```
.
├── app.py                  ← Flask backend + watsonx.ai integration
├── templates/
│   └── index.html          ← Single-page responsive frontend
├── static/
│   ├── style.css           ← Glassmorphism + dark mode design system
│   └── script.js           ← Chat, timer, tasks, dashboard logic
├── .env.example            ← Environment variable template
├── requirements.txt        ← Python dependencies
└── README.md
```

---

## 🚀 Quick Start (Local)

### 1 — Clone / download the project

```bash
git clone <your-repo-url>
cd ai-student-productivity-agent
```

### 2 — Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3 — Install dependencies

```bash
pip install -r requirements.txt
```

### 4 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your IBM credentials:

```env
IBM_API_KEY=your_real_api_key
IBM_URL=https://us-south.ml.cloud.ibm.com
IBM_PROJECT_ID=your_project_id
FLASK_DEBUG=true
```

> **Note:** If you leave the credentials blank, the app runs in **demo mode** with pre-written responses — great for testing the UI without an IBM account.

### 5 — Run the server

```bash
python app.py
```

Open your browser at **http://localhost:5000** 🎉

---

## 🔑 Getting IBM watsonx.ai Credentials

1. Create a free IBM Cloud account at https://cloud.ibm.com
2. Go to **IBM Watson Studio** → create a new project
3. Navigate to **Manage → General** to find your **Project ID**
4. Create an API key at https://cloud.ibm.com/iam/apikeys
5. Note your region URL (e.g. `https://us-south.ml.cloud.ibm.com`)

---

## 🎛️ Customising the AI Agent

All agent behaviour is controlled by the `AGENT_INSTRUCTIONS` dictionary at the top of [`app.py`](app.py):

```python
AGENT_INSTRUCTIONS = {
    "tone": "motivational",          # "friendly" | "motivational" | "strict_mentor"
    "study_modes": [...],            # add/remove study modes
    "productivity_strategies": [...],# add/remove strategies
    "safety_rules": [...],           # add/remove safety constraints
    "persona_name": "Nova",          # rename the AI tutor
    "persona_description": "...",    # change the persona description
}
```

No prompt engineering needed — just edit the dictionary and restart.

---

## 📦 Changing the AI Model

Set `IBM_MODEL_ID` in your `.env` file:

| Model | ID |
|---|---|
| IBM Granite 13B Instruct v2 *(default)* | `ibm/granite-13b-instruct-v2` |
| IBM Granite 3B Code Instruct | `ibm/granite-3b-code-instruct` |
| Meta Llama 3.1 8B Instruct | `meta-llama/llama-3-1-8b-instruct` |
| Mistral 7B Instruct v0.2 | `mistralai/mistral-7b-instruct-v0-2` |

---

## ☁️ Deployment

### Option A — Render (recommended, free tier)

1. Push your project to a GitHub repository
2. Add a `Procfile` in the root:
   ```
   web: gunicorn app:app
   ```
3. Go to https://render.com → **New Web Service**
4. Connect your GitHub repo
5. Set **Build Command**: `pip install -r requirements.txt`
6. Set **Start Command**: `gunicorn app:app`
7. Add **Environment Variables** in the Render dashboard:
   - `IBM_API_KEY`
   - `IBM_URL`
   - `IBM_PROJECT_ID`
8. Deploy 🚀

### Option B — Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Init: `railway init`
4. Set variables: `railway variables set IBM_API_KEY=... IBM_URL=... IBM_PROJECT_ID=...`
5. Deploy: `railway up`

### Option C — Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

```bash
docker build -t nova-agent .
docker run -p 5000:5000 --env-file .env nova-agent
```

---

## 🛡️ Security Notes

- **Never** commit `.env` to version control — add it to `.gitignore`
- API keys are only used server-side; the frontend never sees them
- The IAM token is cached and refreshed automatically

---

## 🧰 Tech Stack

- **Backend**: Python 3.11+, Flask 3.0, python-dotenv, requests, gunicorn
- **AI**: IBM watsonx.ai (IBM Granite family models)
- **Frontend**: Vanilla HTML/CSS/JS, Bootstrap Icons CDN
- **Storage**: Browser `localStorage` for tasks, sessions, streak

---

## 📄 License

MIT — free to use, modify, and distribute.
