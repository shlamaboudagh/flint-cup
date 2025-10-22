// ================= FLINT CUP (Full Working Version) ===================

// ✅ Firebase Imports
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

// ✅ Initialize Firebase
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

// 🗓 Populate years
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

// =============== FIREBASE SYNC ===================
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
  } else alert("❌ Incorrect code.");
});

// =============== OVERVIEW ===================
function renderOverview() {
  const year = currentYear();
  seasonTitle.textContent = `Spring ${year} Season`;
  const data = seasons[year];

  if (!data) {
    overviewContent.innerHTML = `<p>No Flint Cup data for ${year} yet.</p>`;
    setupSeasonBtn.classList.toggle("hidden", !isAdmin);
    editTeamsBtn.classList.add("hidden");
    setWinnerBtn.classList.add("hidden");
    clearSeasonBtn.classList.add("hidden");
    return;
  }

  overviewContent.innerHTML = `
    <h3>Group A</h3><p>${data.groupA.join(", ")}</p>
    <h3>Group B</h3><p>${data.groupB.join(", ")}</p>
    ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
  `;

  if (isAdmin) {
    setupSeasonBtn.classList.add("hidden");
    editTeamsBtn.classList.remove("hidden");
    setWinnerBtn.classList.remove("hidden");
    clearSeasonBtn.classList.remove("hidden");
  }
}

setupSeasonBtn.onclick = () => {
  const year = currentYear();
  if (seasons[year]) return alert(`${year} already exists.`);
  const groupA = [], groupB = [];
  const numA = +prompt("Teams in Group A:");
  for (let i = 1; i <= numA; i++) groupA.push(prompt(`Team ${i} (Group A):`));
  const numB = +prompt("Teams in Group B:");
  for (let i = 1; i <= numB; i++) groupB.push(prompt(`Team ${i} (Group B):`));
  seasons[year] = { groupA, groupB };
  saveToFirebase();
  renderEverything();
};

editTeamsBtn.onclick = () => {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season yet.");
  const newA = data.groupA.map((t, i) => prompt(`Team ${i + 1} (Group A):`, t));
  const newB = data.groupB.map((t, i) => prompt(`Team ${i + 1} (Group B):`, t));
  seasons[year] = { groupA: newA, groupB: newB };
  saveToFirebase();
  renderEverything();
};

clearSeasonBtn.onclick = () => {
  const year = currentYear();
  if (!confirm(`Delete ALL data for ${year}?`)) return;
  delete seasons[year]; delete matches[year]; delete players[year]; delete schedules[year];
  saveToFirebase();
  renderEverything();
};

setWinnerBtn.onclick = () => {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season yet!");
  const winner = prompt(`Enter winner for ${year}:`);
  if (!winner) return;
  seasons[year].winner = winner;
  saveToFirebase();
  renderEverything();
};

// =============== MATCHES ===================
function renderMatches() {
  const list = document.querySelector(".match-list");
  const year = currentYear();
  const arr = matches[year] || [];
  list.innerHTML = arr.map((m, i) => `
    <p><strong>${m.teamA}</strong> ${m.scoreA}-${m.scoreB} <strong>${m.teamB}</strong>
    ${isAdmin ? `
      <button class="editMatchBtn" data-i="${i}">✏️</button>
      <button class="delMatchBtn" data-i="${i}">❌</button>` : ""}
    </p>`).join("") || "<p>No matches yet.</p>";
}

document.getElementById("addMatchBtn").onclick = () => {
  const year = currentYear();
  const teamA = prompt("Team A:"), teamB = prompt("Team B:");
  const scoreA = +prompt(`${teamA} score:`), scoreB = +prompt(`${teamB} score:`);
  if (!teamA || !teamB) return;
  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });
  saveToFirebase();
  renderEverything();
};

// Edit/Delete match
document.querySelector(".match-list").onclick = e => {
  const btn = e.target, year = currentYear();
  if (btn.classList.contains("editMatchBtn")) {
    const i = btn.dataset.i;
    const m = matches[year][i];
    const scoreA = +prompt(`${m.teamA} score:`, m.scoreA);
    const scoreB = +prompt(`${m.teamB} score:`, m.scoreB);
    matches[year][i] = { ...m, scoreA, scoreB };
  }
  if (btn.classList.contains("delMatchBtn")) {
    const i = btn.dataset.i;
    if (!confirm("Delete this match?")) return;
    matches[year].splice(i, 1);
  }
  saveToFirebase();
  renderEverything();
};

// =============== STANDINGS ===================
function calcStandings() {
  const year = currentYear(), s = seasons[year];
  if (!s) return { A: [], B: [] };
  const table = {};
  [...s.groupA, ...s.groupB].forEach(t => table[t] = { MP:0,W:0,L:0,T:0,GF:0,GA:0,P:0 });
  (matches[year] || []).forEach(m => {
    const A = table[m.teamA], B = table[m.teamB];
    if (!A || !B) return;
    A.MP++; B.MP++;
    A.GF+=m.scoreA; B.GF+=m.scoreB;
    A.GA+=m.scoreB; B.GA+=m.scoreA;
    if (m.scoreA>m.scoreB){A.W++;B.L++;} else if (m.scoreA<m.scoreB){B.W++;A.L++;} else {A.T++;B.T++;}
  });
  Object.values(table).forEach(t => t.P = 3*t.W + t.T);
  return { A: s.groupA.map(t => ({ team:t, ...table[t] })), B: s.groupB.map(t => ({ team:t, ...table[t] })) };
}

function renderStandings() {
  const { A, B } = calcStandings();
  const makeTable = d => `
    <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th>T</th><th>GF</th><th>GA</th><th>P</th></tr>
    ${d.map(x=>`
      <tr>
        <td class="team-link" data-team="${x.team}">${x.team}</td>
        <td>${x.MP}</td><td>${x.W}</td><td>${x.L}</td><td>${x.T}</td><td>${x.GF}</td><td>${x.GA}</td><td>${x.P}</td>
      </tr>`).join("")}`;
  document.getElementById("groupA-table").innerHTML = makeTable(A);
  document.getElementById("groupB-table").innerHTML = makeTable(B);

  document.querySelectorAll(".team-link").forEach(td => {
    td.addEventListener("click", () => {
      const team = td.dataset.team;
      document.querySelector('[data-tab="schedules"]').click();
      setTimeout(() => {
        const el = Array.from(document.querySelectorAll(".team-schedule h3"))
          .find(h3 => h3.textContent.toLowerCase() === team.toLowerCase());
        el?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    });
  });
}

// =============== SCHEDULES ===================
function parseDate(str, year) {
  const clean = str.replace(/(\d+)(st|nd|rd|th)/, "$1");
  const d = new Date(`${clean} ${year}`);
  return isNaN(d) ? new Date(0) : d;
}

function renderSchedules() {
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
    div.innerHTML = `<h3>${team}</h3>`;
    const sorted = [...data[team]].sort((a,b)=>parseDate(a.date,year)-parseDate(b.date,year));
    sorted.forEach((g,i)=>{
      div.innerHTML += `<p>${g.date} • ${g.time} • vs ${g.opponent} (${g.homeaway})
      ${isAdmin ? `<button class="editGameBtn" data-team="${team}" data-i="${i}">✏️</button>
      <button class="delGameBtn" data-team="${team}" data-i="${i}">❌</button>` : ""}</p>`;
    });
    cont.appendChild(div);
  });
}

document.getElementById("addGameBtn").onclick = () => {
  const year = currentYear();
  const teamA = prompt("Home team:");
  const teamB = prompt("Away team:");
  const date = prompt("Date (e.g., March 14th):");
  const time = prompt("Time (e.g., 5:00 PM):");
  if (!teamA || !teamB || !date || !time) return alert("All fields required.");
  schedules[year] = schedules[year] || {};
  schedules[year][teamA] = schedules[year][teamA] || [];
  schedules[year][teamB] = schedules[year][teamB] || [];
  schedules[year][teamA].push({ opponent: teamB, date, time, homeaway: "Home" });
  schedules[year][teamB].push({ opponent: teamA, date, time, homeaway: "Away" });
  saveToFirebase();
  renderSchedules();
  alert(`✅ Game added for both ${teamA} and ${teamB}.`);
};

// =============== PLAYERS + STATS + ALL-TIME ===================
function renderPlayers() {
  const list = document.querySelector(".player-list");
  const year = currentYear();
  const arr = players[year] || [];
  list.innerHTML = arr.map((p,i)=>`
    <p><strong>${p.name}</strong> (${p.team}) — ⚽ ${p.goals} | 🎯 ${p.assists} | 🟨 ${p.yellow} | 🟥 ${p.red}
    ${isAdmin ? `<button class="editPlayerBtn" data-i="${i}">✏️</button>
    <button class="delPlayerBtn" data-i="${i}">❌</button>` : ""}</p>`).join("") || "<p>No players yet.</p>";
}

document.getElementById("addPlayerBtn").onclick = () => {
  const year = currentYear();
  const name = prompt("Player name:");
  const team = prompt("Team:");
  const goals = +prompt("Goals:") || 0;
  const assists = +prompt("Assists:") || 0;
  const yellow = +prompt("Yellow cards:") || 0;
  const red = +prompt("Red cards:") || 0;
  if (!name || !team) return;
  players[year] = players[year] || [];
  players[year].push({ name, team, goals, assists, yellow, red });
  saveToFirebase();
  renderPlayers(); renderStats(); renderAllTime();
};

document.querySelector(".player-list").onclick = e => {
  const year = currentYear();
  const btn = e.target;
  if (btn.classList.contains("editPlayerBtn")) {
    const i = btn.dataset.i;
    const p = players[year][i];
    p.name = prompt("Name:", p.name);
    p.team = prompt("Team:", p.team);
    p.goals = +prompt("Goals:", p.goals);
    p.assists = +prompt("Assists:", p.assists);
    p.yellow = +prompt("Yellow cards:", p.yellow);
    p.red = +prompt("Red cards:", p.red);
  }
  if (btn.classList.contains("delPlayerBtn")) {
    const i = btn.dataset.i;
    if (confirm("Delete this player?")) players[year].splice(i, 1);
  }
  saveToFirebase();
  renderPlayers(); renderStats(); renderAllTime();
};

// Stats
function renderStats() {
  const statsDiv = document.querySelector(".stats-board");
  const year = currentYear();
  const arr = players[year] || [];
  if (!arr.length) {
    statsDiv.innerHTML = "<p>No player stats yet.</p>";
    return;
  }
  const getTop = key => {
    const max = Math.max(...arr.map(p => p[key] || 0));
    const leaders = arr.filter(p => p[key] === max && max > 0);
    return { max, leaders };
  };
  const build = (title, d, emoji) =>
    d.max ? `${emoji} ${title}: <strong>${d.leaders.map(p=>p.name).join(", ")}</strong> — ${d.max}`
          : `${emoji} ${title}: No record yet.`;
  statsDiv.innerHTML = `
    <div class="leaderboard">
      <h3>🏆 Season Leaders (${year})</h3>
      <p>${build("Top Scorer", getTop("goals"), "⚽")}</p>
      <p>${build("Top Assister", getTop("assists"), "🎯")}</p>
      <p>${build("Most Yellow Cards", getTop("yellow"), "🟨")}</p>
      <p>${build("Most Red Cards", getTop("red"), "🟥")}</p>
    </div>`;
}

// All-time
function renderAllTime() {
  const list = document.querySelector(".alltime-list");
  list.innerHTML = "";
  let combined = {};
  for (const year in players) {
    (players[year] || []).forEach(p
      if (!combined[p.name]) {
        combined[p.name] = {
          name: p.name,
          team: p.team,
          totalGoals: p.goals,
          totalAssists: p.assists,
          totalYellow: p.yellow,
          totalRed: p.red
        };
      } else {
        combined[p.name].totalGoals += p.goals;
        combined[p.name].totalAssists += p.assists;
        combined[p.name].totalYellow += p.yellow;
        combined[p.name].totalRed += p.red;
      }
    });
  }

  const arr = Object.values(combined);
  if (!arr.length) {
    list.innerHTML = "<p>No all-time data yet.</p>";
    return;
  }

  const getTop = key => {
    const max = Math.max(...arr.map(p => p[key] || 0));
    const leaders = arr.filter(p => p[key] === max && max > 0);
    return { max, leaders };
  };

  const buildSection = (title, icon, key) => {
    const top = getTop(key);
    if (!top.max) return `<h4>${icon} ${title}</h4><p>No records yet.</p>`;
    return `
      <h4>${icon} ${title}</h4>
      ${top.leaders.map(p => `<p><strong>${p.name}</strong> (${p.team}) — ${top.max}</p>`).join("")}
    `;
  };

  const winners = Object.entries(seasons)
    .filter(([_, s]) => s.winner)
    .map(([year, s]) => `<p><strong>${year}:</strong> ${s.winner}</p>`)
    .join("") || "<p>No winners recorded yet.</p>";

  list.innerHTML = `
    <div class="leaderboard">
      <h3>🏆 All-Time Flint Cup Records</h3>
      ${buildSection("Top Scorers", "⚽", "totalGoals")}
      ${buildSection("Top Assisters", "🎯", "totalAssists")}
      ${buildSection("Most Yellow Cards", "🟨", "totalYellow")}
      ${buildSection("Most Red Cards", "🟥", "totalRed")}
      <h3 style="margin-top:25px;">🏅 Season Winners</h3>
      ${winners}
    </div>
  `;
}

// =============== INITIAL RENDER ===================
async function renderEverything() {
  await loadFromFirebase();
  renderOverview();
  renderMatches();
  renderStandings();
  renderSchedules();
  renderPlayers();
  renderStats();
  renderAllTime();

  // Toggle admin buttons if logged in
  document.querySelectorAll(".admin-only").forEach(btn => {
    btn.classList.toggle("hidden", !isAdmin);
  });
}

yearDropdown.onchange = renderEverything;
window.addEventListener("load", renderEverything);
