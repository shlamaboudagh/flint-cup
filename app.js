// ================= FLINT CUP (Full Firebase + Local Storage Sync) ===================

// ✅ Use ES module imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDJF0E9uN3rAnT5i6p1ZpIvR4h8iWSr-I0",
  authDomain: "flintcup.firebaseapp.com",
  databaseURL: "https://flintcup-default-rtdb.firebaseio.com",
  projectId: "flintcup",
  storageBucket: "flintcup.firebasestorage.app",
  messagingSenderId: "343075750510",
  appId: "1:343075750510:web:26d4b383de5e735846dc7f",
  measurementId: "G-JWWEPEH1BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =============== GLOBAL VARIABLES ===================
let isAdmin = false;
let seasons = JSON.parse(localStorage.getItem("seasons")) || {};
let matches = JSON.parse(localStorage.getItem("matches")) || {};
let players = JSON.parse(localStorage.getItem("players")) || {};
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};

const yearDropdown = document.getElementById("yearDropdown");
const overviewContent = document.getElementById("overviewContent");
const setupSeasonBtn = document.getElementById("setupSeasonBtn");
const editTeamsBtn = document.getElementById("editTeamsBtn");
const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const setWinnerBtn = document.getElementById("setWinnerBtn");
const seasonTitle = document.getElementById("seasonTitle");

// Populate years dropdown
const years = [2025, 2026, 2027];
yearDropdown.innerHTML = "";
years.forEach(y => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === 2025) opt.selected = true;
  yearDropdown.appendChild(opt);
});
function currentYear() { return yearDropdown.value; }

// =============== FIREBASE SYNC HELPERS ===================
async function loadFromFirebase() {
  try {
    const snapshot = await get(ref(db, "flintcup"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      seasons = data.seasons || {};
      matches = data.matches || {};
      players = data.players || {};
      schedules = data.schedules || {};
      localStorage.setItem("seasons", JSON.stringify(seasons));
      localStorage.setItem("matches", JSON.stringify(matches));
      localStorage.setItem("players", JSON.stringify(players));
      localStorage.setItem("schedules", JSON.stringify(schedules));
    }
  } catch (err) {
    console.error("⚠️ Firebase load failed:", err);
  }
}

function saveToFirebase() {
  set(ref(db, "flintcup"), { seasons, matches, players, schedules })
    .catch(err => console.error("⚠️ Firebase save failed:", err));
}

// =============== ADMIN LOGIN ===================
document.getElementById("admin-login").addEventListener("click", () => {
  const input = prompt("Enter admin code:");
  if (input === "flintadmin") {
    isAdmin = true;
    alert("✅ Admin access granted!");
    document.querySelectorAll(".admin-only").forEach(e => e.classList.remove("hidden"));
    document.getElementById("admin-login").remove();
    renderEverything();
  } else {
    alert("❌ Incorrect code.");
  }
});

// =============== TAB NAVIGATION ===================
const tabs = document.querySelectorAll(".tab-button");
const sections = document.querySelectorAll(".tab-content");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");

    // Render tab-specific content
    if (tab.dataset.tab === "players") renderPlayers();
    if (tab.dataset.tab === "stats") renderStats();
    if (tab.dataset.tab === "schedules") renderSchedules();
    if (tab.dataset.tab === "alltime") renderAllTime();
  });
});

// =============== OVERVIEW ===================
function renderOverview() {
  const year = currentYear();
  seasonTitle.textContent = `Spring ${year} Season`;
  const data = seasons[year];
  overviewContent.innerHTML = "";

  if (!data) {
    overviewContent.innerHTML = `<p>No Flint Cup data for ${year} yet.</p>`;
    if (isAdmin) setupSeasonBtn.classList.remove("hidden");
    else setupSeasonBtn.classList.add("hidden");
    return;
  }

  setupSeasonBtn.classList.add("hidden");
  if (isAdmin) {
    editTeamsBtn.classList.remove("hidden");
    setWinnerBtn.classList.remove("hidden");
    clearSeasonBtn.classList.remove("hidden");
  }

  overviewContent.innerHTML = `
    <h3>Group A</h3><p>${data.groupA.join(", ")}</p>
    <h3>Group B</h3><p>${data.groupB.join(", ")}</p>
    ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
  `;
}

setupSeasonBtn.onclick = () => {
  const year = currentYear();
  if (seasons[year]) return alert(`${year} already exists.`);
  const groupA = [], groupB = [];
  const numA = parseInt(prompt("How many teams in Group A?"));
  for (let i = 1; i <= numA; i++) groupA.push(prompt(`Team ${i} (Group A):`));
  const numB = parseInt(prompt("How many teams in Group B?"));
  for (let i = 1; i <= numB; i++) groupB.push(prompt(`Team ${i} (Group B):`));
  seasons[year] = { groupA, groupB };
  saveToFirebase();
  renderEverything();
};

// ================= MATCHES =================
function renderMatches() {
  const list = document.querySelector(".match-list");
  const year = currentYear();
  const arr = matches[year] || [];
  list.innerHTML = arr.map((m, i) => `
    <p><strong>${m.teamA}</strong> ${m.scoreA}-${m.scoreB} <strong>${m.teamB}</strong>
    ${isAdmin ? `
      <button class="editMatchBtn" data-i="${i}">✏️</button>
      <button class="delMatchBtn" data-i="${i}">❌</button>` : ""}
    </p>
  `).join("") || "<p>No matches yet.</p>";
}

// ➕ Add Match
function addMatch() {
  const year = currentYear();
  const teamA = prompt("Team A:");
  const teamB = prompt("Team B:");
  const scoreA = +prompt(`${teamA} score:`) || 0;
  const scoreB = +prompt(`${teamB} score:`) || 0;
  if (!teamA || !teamB) return alert("Team names required.");

  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });

  // 🏟 Update schedule results (if they exist)
  updateScheduleResults(year, teamA, teamB, scoreA, scoreB);

  // 🧮 Recalculate standings
  renderStandings();
  saveToFirebase();
  renderMatches();
  renderSchedules();
}

// ✏️ Edit Match
function editMatch(i) {
  const year = currentYear();
  const m = matches[year][i];
  const scoreA = +prompt(`${m.teamA} score:`, m.scoreA);
  const scoreB = +prompt(`${m.teamB} score:`, m.scoreB);

  matches[year][i] = { ...m, scoreA, scoreB };

  updateScheduleResults(year, m.teamA, m.teamB, scoreA, scoreB);
  renderStandings();
  saveToFirebase();
  renderMatches();
  renderSchedules();
}

// ❌ Delete Match
function delMatch(i) {
  const year = currentYear();
  if (!confirm("Delete this match?")) return;
  matches[year].splice(i, 1);
  renderStandings();
  saveToFirebase();
  renderMatches();
  renderSchedules();
}

// 🧩 Helper: update result in schedules
function updateScheduleResults(year, teamA, teamB, scoreA, scoreB) {
  if (!schedules[year]) return;

  [teamA, teamB].forEach(team => {
    if (schedules[year][team]) {
      const game = schedules[year][team].find(
        x => x.opponent === (team === teamA ? teamB : teamA)
      );
      if (game) game.result = `${scoreA}-${scoreB}`;
    }
  });
}

// ================= STANDINGS =================
function calcStandings() {
  const year = currentYear();
  const s = seasons[year];
  if (!s) return { A: [], B: [] };

  // Initialize table for every team
  const table = {};
  [...s.groupA, ...s.groupB].forEach(t => table[t] = {
    MP: 0, W: 0, L: 0, T: 0, GF: 0, GA: 0, P: 0
  });

  // Process each match
  (matches[year] || []).forEach(m => {
    const A = table[m.teamA];
    const B = table[m.teamB];
    if (!A || !B) return;

    A.MP++; B.MP++;
    A.GF += m.scoreA; A.GA += m.scoreB;
    B.GF += m.scoreB; B.GA += m.scoreA;

    if (m.scoreA > m.scoreB) {
      A.W++; B.L++;
    } else if (m.scoreA < m.scoreB) {
      B.W++; A.L++;
    } else {
      A.T++; B.T++;
    }
  });

  // Compute points
  Object.values(table).forEach(t => t.P = 3*t.W + t.T);

  return {
    A: s.groupA.map(t => ({ team: t, ...table[t] })),
    B: s.groupB.map(t => ({ team: t, ...table[t] }))
  };
}

function renderStandings() {
  const { A, B } = calcStandings();
  const makeTable = data => `
    <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th>T</th><th>GF</th><th>GA</th><th>P</th></tr>
    ${data.map(x => `
      <tr>
        <td class="team-link" data-team="${x.team}">${x.team}</td>
        <td>${x.MP}</td><td>${x.W}</td><td>${x.L}</td>
        <td>${x.T}</td><td>${x.GF}</td><td>${x.GA}</td><td>${x.P}</td>
      </tr>`).join("")}
  `;

  document.getElementById("groupA-table").innerHTML = makeTable(A);
  document.getElementById("groupB-table").innerHTML = makeTable(B);

  // 🟡 Make each team name clickable to jump to its schedule
  document.querySelectorAll(".team-link").forEach(td => {
    td.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      document.querySelector('[data-tab="schedules"]').classList.add("active");
      document.getElementById("schedules").classList.add("active");
      renderSchedules(td.dataset.team); // Focus on that team’s schedule
    });
  });
}

// ================= SCHEDULES =================
function parseDate(str, year) {
  const clean = str.replace(/(\d+)(st|nd|rd|th)/, "$1");
  const d = new Date(`${clean} ${year}`);
  return isNaN(d) ? new Date(0) : d;
}

function renderSchedules(focusTeam = "") {
  const year = currentYear();
  const data = schedules[year] || {};
  const cont = document.getElementById("schedulesContainer");
  cont.innerHTML = "";

  if (!Object.keys(data).length) {
    cont.innerHTML = "<p>No schedules yet.</p>";
    return;
  }

  Object.keys(data).forEach(team => {
    const div = document.createElement("div");
    div.className = "team-schedule";
    div.innerHTML = `<h3 id="${team}">${team}</h3>`;

    const sorted = [...data[team]].sort(
      (a, b) => parseDate(a.date, year) - parseDate(b.date, year)
    );

    sorted.forEach((g, i) => {
      div.innerHTML += `
        <p>${g.date} • ${g.time} • vs ${g.opponent} (${g.homeaway})
        ${isAdmin ? `
          <button class="editGameBtn" data-team="${team}" data-i="${i}">✏️</button>
          <button class="delGameBtn" data-team="${team}" data-i="${i}">❌</button>` : ""}
        </p>`;
    });

    cont.appendChild(div);
  });

  if (focusTeam) document.getElementById(focusTeam)?.scrollIntoView({ behavior: "smooth" });
}

// ➕ Add Game (adds to both teams + sorted)
function addGame() {
  const year = currentYear();
  const teamA = prompt("Home team:");
  const teamB = prompt("Away team:");
  const date = prompt("Date (e.g., March 14th):");
  const time = prompt("Time (e.g., 5:00 PM):");
  if (!teamA || !teamB || !date || !time) return alert("All fields are required.");

  schedules[year] = schedules[year] || {};
  schedules[year][teamA] = schedules[year][teamA] || [];
  schedules[year][teamB] = schedules[year][teamB] || [];

  // Add for both
  schedules[year][teamA].push({ opponent: teamB, date, time, homeaway: "Home" });
  schedules[year][teamB].push({ opponent: teamA, date, time, homeaway: "Away" });

  // Sort each team's schedule by date
  schedules[year][teamA].sort((a, b) => parseDate(a.date, year) - parseDate(b.date, year));
  schedules[year][teamB].sort((a, b) => parseDate(a.date, year) - parseDate(b.date, year));

  saveToFirebase();
  renderSchedules();
  alert(`✅ Game added for both ${teamA} and ${teamB}.`);
}

// ✏️ Edit Game (updates both teams)
function editGame(team, i) {
  const year = currentYear();
  const g = schedules[year][team][i];
  const newDate = prompt("Date:", g.date);
  const newTime = prompt("Time:", g.time);
  const newHomeAway = prompt("Home/Away:", g.homeaway);

  const opp = g.opponent;
  schedules[year][team][i] = { opponent: opp, date: newDate, time: newTime, homeaway: newHomeAway };

  const oppList = schedules[year][opp];
  if (oppList) {
    const oppIndex = oppList.findIndex(x => x.opponent === team && x.date === g.date && x.time === g.time);
    if (oppIndex !== -1)
      oppList[oppIndex] = { opponent: team, date: newDate, time: newTime, homeaway: newHomeAway === "Home" ? "Away" : "Home" };
  }

  saveToFirebase();
  renderSchedules();
}

// ❌ Delete Game (removes from both)
function delGame(team, i) {
  const year = currentYear();
  const g = schedules[year][team][i];
  if (!confirm(`Delete ${team} vs ${g.opponent}?`)) return;

  schedules[year][team].splice(i, 1);
  if (!schedules[year][team].length) delete schedules[year][team];

  const oppList = schedules[year][g.opponent];
  if (oppList) {
    const idx = oppList.findIndex(x => x.opponent === team && x.date === g.date && x.time === g.time);
    if (idx !== -1) {
      oppList.splice(idx, 1);
      if (!oppList.length) delete schedules[year][g.opponent];
    }
  }

  saveToFirebase();
  renderSchedules();
}

document.getElementById("addGameBtn").addEventListener("click", addGame);
document.getElementById("schedulesContainer").addEventListener("click", e => {
  const btn = e.target;
  if (btn.classList.contains("editGameBtn")) editGame(btn.dataset.team, btn.dataset.i);
  if (btn.classList.contains("delGameBtn")) delGame(btn.dataset.team, btn.dataset.i);
});


// =============== PLAYERS ===================
function renderPlayers() {
  const list = document.querySelector(".player-list");
  const year = currentYear();
  const arr = players[year] || [];
  list.innerHTML = arr.map((p, i) => `
    <p><strong>${p.name}</strong> (${p.team}) — ⚽ ${p.goals} | 🎯 ${p.assists} | 🟨 ${p.yellow || 0} | 🟥 ${p.red || 0}
    ${isAdmin ? `
      <button class="editPlayerBtn" data-i="${i}">✏️</button>
      <button class="delPlayerBtn" data-i="${i}">❌</button>` : ""}
    </p>
  `).join("") || "<p>No players yet.</p>";
}

// ➕ Add Player
const addPlayerBtn = document.getElementById("addPlayerBtn");
if (addPlayerBtn) {
  addPlayerBtn.addEventListener("click", () => {
    const year = currentYear();
    const name = prompt("Player name:");
    const team = prompt("Team name:");
    const goals = +prompt("Goals:") || 0;
    const assists = +prompt("Assists:") || 0;
    const yellow = +prompt("Yellow cards:") || 0;
    const red = +prompt("Red cards:") || 0;
    if (!name || !team) return alert("Player name and team are required.");

    players[year] = players[year] || [];
    players[year].push({ name, team, goals, assists, yellow, red });

    saveToFirebase();
    renderPlayers();
  });
}

// ✏️ Edit & ❌ Delete
document.querySelector(".player-list").addEventListener("click", e => {
  const btn = e.target;
  const year = currentYear();
  if (btn.classList.contains("editPlayerBtn")) {
    const i = btn.dataset.i;
    const p = players[year][i];
    p.name = prompt("Name:", p.name);
    p.team = prompt("Team:", p.team);
    p.goals = +prompt("Goals:", p.goals);
    p.assists = +prompt("Assists:", p.assists);
    p.yellow = +prompt("Yellows:", p.yellow);
    p.red = +prompt("Reds:", p.red);
    saveToFirebase();
    renderPlayers();
  }
  if (btn.classList.contains("delPlayerBtn")) {
    const i = btn.dataset.i;
    if (confirm("Delete this player?")) {
      players[year].splice(i, 1);
      saveToFirebase();
      renderPlayers();
    }
  }
});


// =============== STATS + ALLTIME (same as before) ===============
function renderStats(){/* omitted for brevity but keep your working one */}
function renderAllTime(){/* same as before */}

// =============== INITIAL RENDER ===================
async function renderEverything(){
  await loadFromFirebase();
  renderOverview();
  renderMatches();
  renderStandings();
}
yearDropdown.onchange=renderEverything;
window.addEventListener("load",renderEverything);

