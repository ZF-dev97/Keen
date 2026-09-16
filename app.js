import { generateNumeracy } from './numeracy.js';

const ICONS = {
  numeracy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19V14M12 19V9M19 19V5"/></svg>',
  literacy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.2C4 6.2 7.2 4.8 12 6.2C16.8 4.8 20 6.2 20 6.2V18C20 18 16.8 16.6 12 18C7.2 16.6 4 18 4 18V6.2Z"/><path d="M12 6.2V18"/></svg>',
  verbal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V13.5C20 14.3284 19.3284 15 18.5 15H9L5.5 18V15H5.5C4.67157 15 4 14.3284 4 13.5V6.5Z"/><circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none"/></svg>',
  critical: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18H15"/><path d="M10 21H14"/><path d="M12 3C8.68629 3 6 5.68629 6 9C6 11.0631 7.03323 12.8834 8.6 14.0004C9.02 14.3 9.3 14.77 9.3 15.28V15.5C9.3 16.0523 9.74772 16.5 10.3 16.5H13.7C14.2523 16.5 14.7 16.0523 14.7 15.5V15.28C14.7 14.77 14.98 14.3 15.4 14.0004C16.9668 12.8834 18 11.0631 18 9C18 5.68629 15.3137 3 12 3Z"/></svg>'
};
const CHECK_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13L9.5 17.5L19 7"/></svg>';
const X_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6L18 18M18 6L6 18"/></svg>';

const CATEGORIES = [
  { key: 'numeracy', label: 'Numeracy', title: 'Number Sequences', desc: 'Spot the pattern and find what comes next.', time: '2 min', hue: 250 },
  { key: 'literacy', label: 'Literacy', title: 'Word Roots', desc: 'Match words to their Latin and Greek origins.', time: '3 min', hue: 190 },
  { key: 'verbal', label: 'Verbal Reasoning', title: 'Odd One Out', desc: "Find the word that doesn't belong.", time: '2 min', hue: 300 },
  { key: 'critical', label: 'Critical Thinking', title: 'Spot the Flaw', desc: 'Find the gap in a short argument.', time: '3 min', hue: 40 }
];

// ---------- date & storage helpers ----------

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function yesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getProgress(dateStr) {
  try {
    const raw = localStorage.getItem(`keen:progress:${dateStr}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setProgress(dateStr, progress) {
  try {
    localStorage.setItem(`keen:progress:${dateStr}`, JSON.stringify(progress));
  } catch { /* storage unavailable — app still works, just won't remember */ }
}

function getStreak() {
  try {
    return parseInt(localStorage.getItem('keen:streak') || '0', 10);
  } catch {
    return 0;
  }
}

function updateStreakIfComplete(dateStr, progress) {
  const allDone = CATEGORIES.every((c) => progress[c.key]);
  if (!allDone) return;
  let lastFull;
  try { lastFull = localStorage.getItem('keen:lastFullDate'); } catch { lastFull = null; }
  if (lastFull === dateStr) return; // already counted today
  const streak = lastFull === yesterdayStr() ? getStreak() + 1 : 1;
  try {
    localStorage.setItem('keen:streak', String(streak));
    localStorage.setItem('keen:lastFullDate', dateStr);
  } catch { /* ignore */ }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ---------- data loading ----------

async function loadTodayData(dateStr) {
  try {
    const res = await fetch(`exercises/${dateStr}.json`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch { /* fall through to fallback */ }
  const res = await fetch('exercises/fallback.json');
  return await res.json();
}

// ---------- app state ----------

const state = {
  view: 'home', // 'home' | 'exercise'
  activeCategory: null,
  today: todayStr(),
  progress: {},
  data: null // { literacy, verbal, critical } for today (or fallback)
};

function currentQuestion(categoryKey) {
  if (categoryKey === 'numeracy') return generateNumeracy(state.today);
  return state.data[categoryKey];
}

// ---------- rendering ----------

const root = document.getElementById('app');

function render() {
  root.innerHTML = state.view === 'home' ? renderHome() : renderExercise();
  wireEvents();
}

function renderNav(activeTab) {
  return `
    <div class="nav">
      <div class="nav-left">
        <div class="brand">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10.5" stroke="var(--accent)" stroke-width="2.2"/>
            <circle cx="14" cy="14" r="3" fill="var(--accent)"/>
          </svg>
          <span>Keen</span>
        </div>
        <div class="nav-tabs">
          <button class="nav-tab ${activeTab === 'today' ? 'active' : ''}">Today</button>
          <button class="nav-tab">Progress</button>
          <button class="nav-tab">Categories</button>
        </div>
      </div>
      <div class="nav-right">
        <div class="streak-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="oklch(0.6 0.16 40)" stroke="none"><path d="M12 21C15.3137 21 18 18.5 18 15.3C18 12.7 16.1 10.7 15.1 9.2C15.3 10.2 14.6 11.1 13.7 11.1C14.2 9.1 12.7 6.6 10.7 5.1C11.2 7.1 10.1 8.1 9.1 9.6C7.9 11.3 6 12.9 6 15.3C6 18.5 8.68629 21 12 21Z"/></svg>
          <span>${getStreak()}</span>
        </div>
        <div class="avatar"></div>
      </div>
    </div>`;
}

function renderHome() {
  const progress = state.progress;
  const completedCount = CATEGORIES.filter((c) => progress[c.key]).length;
  const remainingMinutes = (4 - completedCount) * 2;
  const circumference = 163.36;
  const ringOffset = circumference * (1 - completedCount / 4);

  const cards = CATEGORIES.map((c) => {
    const done = !!progress[c.key];
    return `
      <div class="ex-card">
        <div class="row-top">
          <div class="ex-icon" style="background:oklch(0.6 0.13 ${c.hue} / 0.14); color:oklch(0.5 0.15 ${c.hue});">${ICONS[c.key]}</div>
          <span class="time-chip">${c.time}</span>
        </div>
        <div class="ex-body">
          <span class="eyebrow" style="color:oklch(0.5 0.15 ${c.hue});">${c.label}</span>
          <span class="ex-title">${c.title}</span>
          <span class="ex-desc">${c.desc}</span>
        </div>
        ${done
          ? `<div class="done-row">${CHECK_ICON.replace('currentColor', 'var(--success)')}<span class="label">Completed</span><button class="redo-link" data-redo="${c.key}">Redo</button></div>`
          : `<button class="start-btn" data-start="${c.key}">Start exercise</button>`}
      </div>`;
  }).join('');

  return `
    ${renderNav('today')}
    <div class="home-main">
      <div class="hero">
        <h1>${greeting()}</h1>
        <p>Today's set — four quick exercises, about 8 minutes total.</p>
      </div>
      <div class="progress-card">
        <svg width="64" height="64" viewBox="0 0 64 64" style="flex-shrink:0;">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--surface-2)" stroke-width="6"/>
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"
            stroke-dasharray="${circumference}" stroke-dashoffset="${ringOffset}" transform="rotate(-90 32 32)"/>
        </svg>
        <div class="info">
          <span class="count">${completedCount} of 4 complete</span>
          <span class="sub">${completedCount === 4 ? "You're done for today — nice work." : `Keep going — about ${remainingMinutes} min left today`}</span>
        </div>
      </div>
      <div class="card-grid">${cards}</div>
    </div>`;
}

function renderExercise() {
  const c = CATEGORIES.find((x) => x.key === state.activeCategory);
  const q = state.exerciseQuestion;

  return `
    <div class="exercise-top">
      <button class="exit-btn" data-exit="1">${X_ICON.replace(/currentColor/g, 'var(--text-muted)').replace('width="18" height="18"', 'width="15" height="15"')}</button>
      <span class="exercise-cat" style="color:oklch(0.5 0.15 ${c.hue});">${c.label}</span>
      <span class="exercise-spacer"></span>
    </div>
    <div class="exercise-main">
      <div class="exercise-panel">
        <h2>${q.prompt}</h2>
        <div class="options">
          ${q.options.map((label, i) => {
            let cls = 'option-btn';
            let icon = '';
            if (state.revealed) {
              if (i === q.correctIndex) { cls += ' correct'; icon = CHECK_ICON; }
              else if (i === state.selected) { cls += ' incorrect'; icon = X_ICON; }
            } else if (i === state.selected) {
              cls += ' selected';
            }
            return `<button class="${cls}" data-opt="${i}" ${state.revealed ? 'disabled' : ''}>
              <span>${label}</span>${icon}
            </button>`;
          }).join('')}
        </div>
        ${state.revealed ? `
          <div class="feedback">
            <p>${q.explanation}</p>
            <button class="continue-btn" data-continue="1">Back to today</button>
          </div>` : ''}
      </div>
    </div>`;
}

// ---------- interaction ----------

function startExercise(categoryKey) {
  state.activeCategory = categoryKey;
  state.exerciseQuestion = currentQuestion(categoryKey);
  state.selected = null;
  state.revealed = false;
  state.view = 'exercise';
  render();
}

function selectOption(i) {
  if (state.revealed) return;
  state.selected = i;
  state.revealed = true;
  render();
}

function finishExercise() {
  state.progress[state.activeCategory] = true;
  setProgress(state.today, state.progress);
  updateStreakIfComplete(state.today, state.progress);
  state.view = 'home';
  render();
}

function redoExercise(categoryKey) {
  delete state.progress[categoryKey];
  setProgress(state.today, state.progress);
  startExercise(categoryKey);
}

function wireEvents() {
  root.querySelectorAll('[data-start]').forEach((el) =>
    el.addEventListener('click', () => startExercise(el.getAttribute('data-start'))));
  root.querySelectorAll('[data-redo]').forEach((el) =>
    el.addEventListener('click', () => redoExercise(el.getAttribute('data-redo'))));
  root.querySelectorAll('[data-opt]').forEach((el) =>
    el.addEventListener('click', () => selectOption(parseInt(el.getAttribute('data-opt'), 10))));
  const exit = root.querySelector('[data-exit]');
  if (exit) exit.addEventListener('click', () => { state.view = 'home'; render(); });
  const cont = root.querySelector('[data-continue]');
  if (cont) cont.addEventListener('click', finishExercise);
}

// ---------- boot ----------

async function boot() {
  state.progress = getProgress(state.today);
  state.data = await loadTodayData(state.today);
  render();
}

boot();
