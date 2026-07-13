/* ═══════════════════════════════════════════════════════════════════════════
   Nova — AI Student Productivity Agent  ·  script.js
   Features: Chat, Task Manager, Pomodoro Timer, Dashboard, Tips
═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ── SVG gradient definition (for ring timer) ──────────────────────────────
document.body.insertAdjacentHTML('afterbegin', `
<svg class="hidden-defs">
  <defs>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
</svg>`);

// ════════════════════════════════════════════════════════════════════════════
//  THEME TOGGLE
// ════════════════════════════════════════════════════════════════════════════
const html         = document.documentElement;
const themeToggle  = document.getElementById('themeToggle');
const themeToggleM = document.getElementById('themeToggleMobile');

function applyTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  const icon = dark ? 'bi-sun-fill' : 'bi-moon-fill';
  themeToggle.innerHTML  = `<i class="bi ${icon}"></i>`;
  themeToggleM.innerHTML = `<i class="bi ${icon}"></i>`;
  localStorage.setItem('nova_theme', dark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('nova_theme');
applyTheme(savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches));

[themeToggle, themeToggleM].forEach(btn =>
  btn.addEventListener('click', () =>
    applyTheme(html.getAttribute('data-theme') !== 'dark')
  )
);

// ════════════════════════════════════════════════════════════════════════════
//  SIDEBAR / NAVIGATION
// ════════════════════════════════════════════════════════════════════════════
const sidebar      = document.getElementById('sidebar');
const hamburger    = document.getElementById('hamburger');
const navItems     = document.querySelectorAll('.nav-item');
const panels       = document.querySelectorAll('.panel');

hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  if (sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== hamburger) {
    sidebar.classList.remove('open');
  }
});

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(`panel-${item.dataset.panel}`).classList.add('active');
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
    if (item.dataset.panel === 'dashboard') refreshDashboard();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  STORAGE HELPERS
// ════════════════════════════════════════════════════════════════════════════
const store = {
  get:    key        => JSON.parse(localStorage.getItem(key) || 'null'),
  set:    (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  update: (key, fn)  => store.set(key, fn(store.get(key))),
};

// ════════════════════════════════════════════════════════════════════════════
//  CHAT
// ════════════════════════════════════════════════════════════════════════════
const chatMessages    = document.getElementById('chatMessages');
const userInput       = document.getElementById('userInput');
const sendBtn         = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// Send on Enter (Shift+Enter = newline)
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

sendBtn.addEventListener('click', sendMessage);

// Quick prompt buttons
document.querySelectorAll('.qp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.dataset.prompt;
    sendMessage();
  });
});

function appendMessage(text, role) {
  const wrap = document.createElement('div');
  wrap.className = `message ${role === 'user' ? 'user-message' : 'bot-message'}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role === 'user' ? 'user-avatar' : 'bot-avatar'}`;
  avatar.textContent = role === 'user' ? '👤' : '✦';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = formatText(text);

  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatText(text) {
  // Convert markdown-style lists and bold to HTML
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

function showTyping()  {
  chatMessages.appendChild(typingIndicator);
  typingIndicator.style.display = 'flex';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping()  {
  typingIndicator.style.display = 'none';
  document.getElementById('panel-chat').appendChild(typingIndicator);
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user');
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;

  showTyping();

  try {
    const res  = await fetch('/generate-response', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: text }),
    });
    const data = await res.json();
    hideTyping();
    if (data.error) {
      appendMessage(`⚠️ ${data.error}`, 'bot');
    } else {
      appendMessage(data.response, 'bot');
    }
  } catch {
    hideTyping();
    appendMessage('⚠️ Could not reach the server. Make sure Flask is running.', 'bot');
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  TASK MANAGER
// ════════════════════════════════════════════════════════════════════════════
const taskInput    = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const addTaskBtn   = document.getElementById('addTaskBtn');
const taskList     = document.getElementById('taskList');
const taskStatsTxt = document.getElementById('taskStatsText');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const filterBtns   = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';

function getTasks()       { return store.get('nova_tasks') || []; }
function saveTasks(tasks) { store.set('nova_tasks', tasks); }

function createTask(text, priority = 'medium') {
  return { id: Date.now(), text, priority, done: false, created: new Date().toISOString() };
}

function renderTasks() {
  const tasks = getTasks();
  const filtered = tasks.filter(t => {
    if (currentFilter === 'all')     return true;
    if (currentFilter === 'pending') return !t.done;
    if (currentFilter === 'done')    return t.done;
  });

  taskList.innerHTML = '';

  if (filtered.length === 0) {
    taskList.innerHTML = `<li class="empty-state">✨ No tasks here — ${currentFilter === 'done' ? 'complete some tasks first!' : 'add your first task above!'}</li>`;
  } else {
    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item${task.done ? ' done' : ''}`;
      li.dataset.id = task.id;
      li.innerHTML = `
        <button class="task-check${task.done ? ' checked' : ''}" data-id="${task.id}">
          ${task.done ? '<i class="bi bi-check-lg"></i>' : ''}
        </button>
        <div class="priority-dot ${task.priority}"></div>
        <span class="task-text">${escHtml(task.text)}</span>
        <button class="delete-task-btn" data-id="${task.id}" title="Delete task">
          <i class="bi bi-trash3"></i>
        </button>`;
      taskList.appendChild(li);
    });
  }

  const done  = tasks.filter(t => t.done).length;
  taskStatsTxt.textContent = `${tasks.length} tasks total — ${done} completed`;

  // Update dashboard stats
  document.getElementById('statTasksDone').textContent = done;
  updateStreakActivity();
}

taskList.addEventListener('click', e => {
  const checkBtn  = e.target.closest('.task-check');
  const deleteBtn = e.target.closest('.delete-task-btn');

  if (checkBtn) {
    const id    = Number(checkBtn.dataset.id);
    const tasks = getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTasks(tasks);
    renderTasks();
  }

  if (deleteBtn) {
    const id    = Number(deleteBtn.dataset.id);
    saveTasks(getTasks().filter(t => t.id !== id));
    renderTasks();
  }
});

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  const tasks = getTasks();
  tasks.push(createTask(text, taskPriority.value));
  saveTasks(tasks);
  taskInput.value = '';
  renderTasks();
}

clearDoneBtn.addEventListener('click', () => {
  saveTasks(getTasks().filter(t => !t.done));
  renderTasks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Init tasks
renderTasks();

// ════════════════════════════════════════════════════════════════════════════
//  POMODORO TIMER
// ════════════════════════════════════════════════════════════════════════════
const timerDisplay  = document.getElementById('timerDisplay');
const timerLabel    = document.getElementById('timerLabel');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const ringProgress  = document.getElementById('ringProgress');
const modeTabs      = document.querySelectorAll('.mode-tab');
const sessionsTodayEl = document.getElementById('sessionsToday');
const focusTimeEl     = document.getElementById('focusTime');

const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // r=88

let timerState = {
  totalSeconds:   25 * 60,
  remaining:      25 * 60,
  running:        false,
  interval:       null,
  currentMinutes: 25,
  currentLabel:   'Focus',
  isFocusMode:    true,
};

function setRingProgress(remaining, total) {
  const ratio  = remaining / total;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = offset;
}

function updateTimerDisplay() {
  const m = Math.floor(timerState.remaining / 60).toString().padStart(2, '0');
  const s = (timerState.remaining % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
  timerLabel.textContent   = timerState.currentLabel;
  setRingProgress(timerState.remaining, timerState.totalSeconds);
}

function tick() {
  if (timerState.remaining <= 0) {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerStartBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
    onTimerComplete();
    return;
  }
  timerState.remaining--;
  updateTimerDisplay();
}

function onTimerComplete() {
  playBeep();
  if (timerState.isFocusMode) {
    // Record session
    const todayKey  = todayStr();
    const sessions  = store.get('nova_sessions') || {};
    sessions[todayKey] = (sessions[todayKey] || 0) + 1;
    store.set('nova_sessions', sessions);

    const focusMins = store.get('nova_focus_mins') || {};
    focusMins[todayKey] = (focusMins[todayKey] || 0) + timerState.currentMinutes;
    store.set('nova_focus_mins', focusMins);

    updateStreakActivity();
    updateSessionUI();
    alert(`🎉 Focus session complete! Time for a break.`);
  } else {
    alert(`☕ Break over! Ready to focus again?`);
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {}
}

timerStartBtn.addEventListener('click', () => {
  if (timerState.running) {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerStartBtn.innerHTML = '<i class="bi bi-play-fill"></i> Resume';
  } else {
    timerState.interval = setInterval(tick, 1000);
    timerState.running  = true;
    timerStartBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
  }
});

timerResetBtn.addEventListener('click', () => {
  clearInterval(timerState.interval);
  timerState.running   = false;
  timerState.remaining = timerState.totalSeconds;
  timerStartBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
  updateTimerDisplay();
});

modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    clearInterval(timerState.interval);
    timerState.running = false;
    modeTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const mins  = parseInt(tab.dataset.minutes, 10);
    const label = tab.dataset.label;
    timerState.currentMinutes = mins;
    timerState.currentLabel   = label;
    timerState.totalSeconds   = mins * 60;
    timerState.remaining      = mins * 60;
    timerState.isFocusMode    = (mins >= 20);
    timerStartBtn.innerHTML   = '<i class="bi bi-play-fill"></i> Start';
    updateTimerDisplay();
  });
});

function updateSessionUI() {
  const todayKey = todayStr();
  const sessions = (store.get('nova_sessions') || {})[todayKey] || 0;
  const focusMins = (store.get('nova_focus_mins') || {})[todayKey] || 0;
  sessionsTodayEl.textContent = sessions;
  focusTimeEl.textContent     = `${focusMins} min`;
  document.getElementById('statSessions').textContent = sessions;
  document.getElementById('statFocusMin').textContent = focusMins;
}

// Init timer ring
updateTimerDisplay();
updateSessionUI();

// ════════════════════════════════════════════════════════════════════════════
//  STREAK & DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function updateStreakActivity() {
  const todayKey   = todayStr();
  const activity   = store.get('nova_activity') || {};
  const hasTasks   = getTasks().some(t => t.done);
  const hasSessions = ((store.get('nova_sessions') || {})[todayKey] || 0) > 0;

  if (hasTasks || hasSessions) {
    activity[todayKey] = true;
    store.set('nova_activity', activity);
  }

  // Calculate streak
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (activity[key]) { streak++; } else { break; }
  }

  document.getElementById('streakCount').textContent = streak;
  document.getElementById('statStreak').textContent  = streak;
  store.set('nova_streak', streak);
}

function buildWeekBars() {
  const focusMins  = store.get('nova_focus_mins') || {};
  const container  = document.getElementById('weekBars');
  const days       = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today      = new Date();
  const vals       = [];

  for (let i = 6; i >= 0; i--) {
    const d   = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    vals.push({ label: days[d.getDay()], mins: focusMins[key] || 0 });
  }

  const maxVal = Math.max(...vals.map(v => v.mins), 1);
  container.innerHTML = vals.map(v => {
    const pct = Math.round((v.mins / maxVal) * 90);
    return `<div class="day-bar-wrap">
      <div class="day-bar" style="height:${pct}px" title="${v.mins} min"></div>
      <span class="day-label">${v.label}</span>
    </div>`;
  }).join('');
}

function refreshDashboard() {
  updateSessionUI();
  updateStreakActivity();
  buildWeekBars();
  loadQuote();
}

// ════════════════════════════════════════════════════════════════════════════
//  MOTIVATIONAL QUOTES
// ════════════════════════════════════════════════════════════════════════════
const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "It always seems impossible until it's done. — Nelson Mandela",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream big. Start small. Act now.",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "Study not to know more, but to know better.",
  "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
  "Focus on progress, not perfection.",
  "The pain of studying is far less than the pain of regret.",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Every master was once a disaster. Keep learning.",
  "Small daily improvements lead to stunning results.",
  "GATE is just a gate — you have the key. Keep preparing.",
  "Your future self is watching. Make them proud.",
  "Discipline is choosing between what you want now and what you want most.",
  "One page a day makes a masterpiece in a year.",
];

let lastQuoteIdx = -1;

function loadQuote() {
  let idx;
  do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === lastQuoteIdx);
  lastQuoteIdx = idx;
  document.getElementById('quoteText').textContent = QUOTES[idx];
}

document.getElementById('refreshQuote').addEventListener('click', loadQuote);
loadQuote();

// ════════════════════════════════════════════════════════════════════════════
//  TIPS / STUDY MODES
// ════════════════════════════════════════════════════════════════════════════
const TIPS_PROMPTS = {
  gate:     "Give me a detailed, structured 30-day GATE preparation plan for Computer Science covering OS, DBMS, Networks, Algorithms, TOC, and Digital Logic. Include daily topic goals.",
  pomodoro: "Explain the Pomodoro technique in depth and create a full-day study schedule using Pomodoro intervals. Include subject rotation tips.",
  dsa:      "Create a 60-day DSA roadmap for coding interview preparation. Include arrays, linked lists, trees, graphs, DP and system design basics. Give a week-by-week breakdown.",
  revision: "Explain spaced repetition and create a revision schedule for a student preparing for exams 4 weeks away. Include subject priorities and review intervals.",
  deepwork: "Guide me through Cal Newport's deep work protocol for students. Provide a weekly schedule template and tips to eliminate distractions during study.",
  burnout:  "I am feeling study burnout and overwhelmed. Give me a compassionate, practical 7-day recovery plan that rebalances rest, light study, and self-care.",
};

const tipsResponseArea = document.getElementById('tipsResponseArea');
const tipsLoading      = document.getElementById('tipsLoading');
const tipsContent      = document.getElementById('tipsContent');

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', async () => {
    const mode   = card.dataset.mode;
    const prompt = TIPS_PROMPTS[mode];
    if (!prompt) return;

    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('loading'));
    card.classList.add('loading');

    tipsResponseArea.style.display = 'block';
    tipsLoading.style.display      = 'flex';
    tipsContent.textContent        = '';

    try {
      const res  = await fetch('/generate-response', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      tipsLoading.style.display = 'none';
      tipsContent.innerHTML = data.error
        ? `<p>⚠️ ${data.error}</p>`
        : formatText(data.response || '');
    } catch {
      tipsLoading.style.display = 'none';
      tipsContent.innerHTML = '<p>⚠️ Could not reach the server.</p>';
    } finally {
      card.classList.remove('loading');
    }

    tipsResponseArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════════════════
updateStreakActivity();
buildWeekBars();
