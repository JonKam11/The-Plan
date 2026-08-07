// Bulk Tracker - app.js
// Dashboard + Gym pages, gym session log with list/calendar history,
// settings popup with theme switching. Data is localStorage only for now.

const STORAGE_KEY = "bulk-tracker-sessions";
const THEME_KEY = "bulk-tracker-theme";
const PAGE_KEY = "bulk-tracker-page";

// ---------- Sessions data ----------

function getSessions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function addSession(type, date) {
  const sessions = getSessions();
  sessions.push({ id: Date.now().toString(), type, date });
  sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveSessions(sessions);
}

function deleteSession(id) {
  const sessions = getSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ---------- List view ----------

function renderList() {
  const listEl = document.getElementById("history-list");
  const sessions = getSessions();

  if (sessions.length === 0) {
    listEl.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
    return;
  }

  listEl.innerHTML = sessions
    .map(
      (s) => `
      <div class="history-item">
        <div>
          <div class="session-name">${s.type}</div>
          <div class="session-date">${formatDateLabel(s.date)}</div>
        </div>
        <button class="delete-btn" data-id="${s.id}">Delete</button>
      </div>
    `
    )
    .join("");

  listEl.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteSession(btn.dataset.id);
      renderAll();
    });
  });
}

// ---------- Calendar view ----------

let calViewDate = new Date();

function renderCalendar() {
  const grid = document.getElementById("cal-grid");
  const label = document.getElementById("cal-month-label");
  const sessions = getSessions();

  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();

  label.textContent = calViewDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const sessionDates = new Set(sessions.map((s) => s.date));

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  let html = dayLabels.map((d) => `<div class="cal-day-label">${d}</div>`).join("");

  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasSession = sessionDates.has(dateStr);
    html += `<div class="cal-day${hasSession ? " has-session" : ""}">${day}</div>`;
  }

  grid.innerHTML = html;
}

function renderAll() {
  renderList();
  renderCalendar();
}

// ---------- Gym page wiring ----------

document.getElementById("log-session-btn").addEventListener("click", () => {
  const type = document.getElementById("session-type").value;
  const date = document.getElementById("session-date").value;

  if (!type || !date) {
    alert("Pick a session type and a date first.");
    return;
  }

  addSession(type, date);
  document.getElementById("session-type").value = "";
  renderAll();
});

document.getElementById("view-list-btn").addEventListener("click", () => {
  document.getElementById("history-list").classList.remove("hidden");
  document.getElementById("history-calendar").classList.add("hidden");
  document.getElementById("view-list-btn").classList.add("active");
  document.getElementById("view-calendar-btn").classList.remove("active");
});

document.getElementById("view-calendar-btn").addEventListener("click", () => {
  document.getElementById("history-calendar").classList.remove("hidden");
  document.getElementById("history-list").classList.add("hidden");
  document.getElementById("view-calendar-btn").classList.add("active");
  document.getElementById("view-list-btn").classList.remove("active");
});

document.getElementById("cal-prev").addEventListener("click", () => {
  calViewDate.setMonth(calViewDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("cal-next").addEventListener("click", () => {
  calViewDate.setMonth(calViewDate.getMonth() + 1);
  renderCalendar();
});

// ---------- Page switching (Dashboard / Gym) ----------

function switchPage(page) {
  document.querySelectorAll(".page").forEach((el) => el.classList.add("hidden"));
  document.getElementById(`page-${page}`).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  localStorage.setItem(PAGE_KEY, page);

  if (page === "gym") {
    renderAll();
  }
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

// ---------- Settings popup / theme ----------

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  document.querySelectorAll(".theme-swatch").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.theme === theme);
  });
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "midnight";
  applyTheme(saved);
}

document.querySelectorAll(".theme-swatch").forEach((btn) => {
  btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
});

function openSettings() {
  document.getElementById("settings-modal").classList.remove("hidden");
  document.getElementById("settings-overlay").classList.remove("hidden");
}

function closeSettings() {
  document.getElementById("settings-modal").classList.add("hidden");
  document.getElementById("settings-overlay").classList.add("hidden");
}

document.getElementById("settings-btn").addEventListener("click", openSettings);
document.getElementById("settings-close").addEventListener("click", closeSettings);
document.getElementById("settings-overlay").addEventListener("click", closeSettings);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSettings();
});

// ---------- Init ----------

initTheme();

document.getElementById("session-date").value = new Date().toISOString().split("T")[0];

const savedPage = localStorage.getItem(PAGE_KEY) || "dashboard";
switchPage(savedPage);

renderAll();
