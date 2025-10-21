// ================= FLINT CUP (Firebase Version) ===================

// Load Firebase SDK (import must be at top)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔧 Your Firebase Configuration
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

// ================= GLOBAL VARIABLES =================
let isAdmin = false;
let seasons = {};
let matches = {};
let players = {};
let schedules = {};

const yearDropdown = document.getElementById("yearDropdown");
const overviewContent = document.getElementById("overviewContent");
const setupSeasonBtn = document.getElementById("setupSeasonBtn");
const editTeamsBtn = document.getElementById("editTeamsBtn");
const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const setWinnerBtn = document.getElementById("setWinnerBtn");
const seasonTitle = document.getElementById("seasonTitle");

// Year options
const years = [2025, 2026, 2027];
years.forEach(y => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === 2025) opt.selected = true;
  yearDropdown.appendChild(opt);
});
function currentYear() { return yearDropdown.value; }

// ================= FIREBASE HELPERS =================
async function loadData() {
  const snap = await get(ref(db, "flintcup"));
  if (snap.exists()) {
    const data = snap.val();
    seasons = data.seasons || {};
    matches = data.matches || {};
    players = data.players || {};
    schedules = data.schedules || {};
  } else {
    seasons = {}; matches = {}; players = {}; schedules = {};
  }
}

function saveData() {
  set(ref(db, "flintcup"), { seasons, matches, players, schedules });
}

// ================= ADMIN LOGIN =================
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

// ================= TAB NAVIGATION =================
document.querySelectorAll(".tab-button").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// ================= OVERVIEW =================
function renderOverview() {
  const year = currentYear();
  seasonTitle.textContent = `Spring ${year} Season`;
  const data = seasons[year];
  overviewContent.innerHTML = "";

  if (!data) {
    overviewContent.innerHTML = `<p>No Flint Cup data for ${year} yet.</p>`;
    if (isAdmin) setupSeasonBtn.classList.remove("hidden");
    return;
  }

  setupSeasonBtn.classList.add("hidden");

  if (isAdmin) {
    editTeamsBtn.classList.remove("hidden");
    setWinnerBtn.classList.remove("hidden");
    clearSeasonBtn.classList.remove("hidden");
  }

  overviewContent.innerHTML = `
    <h3>Group A</h3>
    <p>${data.groupA.join(", ")}</p>
    <h3>Group B</h3>
    <p>${data.groupB.join(", ")}</p>
    ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
  `;
}

async function setupNewSeason() {
  const year = currentYear();
  if (seasons[year]) return alert(`${year} already exists.`);
  const groupA = [], groupB = [];

  const numA = parseInt(prompt("How many teams in Group A?"));
  for (let i = 1; i <= numA; i++) groupA.push(prompt(`Team ${i} (Group A):`));
  const numB = parseInt(prompt("How many teams in Group B?"));
  for (let i = 1; i <= numB; i++) groupB.push(prompt(`Team ${i} (Group B):`));

  seasons[year] = { groupA, groupB };
  saveData();
  alert(`✅ ${year} Season Created!`);
  renderEverything();
}

function editTeams() {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season yet.");
  const newA = data.groupA.map((t, i) => prompt(`Team ${i + 1} (Group A):`, t));
  const newB = data.groupB.map((t, i) => prompt(`Team ${i + 1} (Group B):`, t));
  seasons[year] = { groupA: newA, groupB: newB };
  saveData();
  alert(`✅ ${year} Teams Updated!`);
  renderEverything();
}

function clearSeason() {
  const year = currentYear();
  if (!confirm(`Delete ALL data for ${year}?`)) return;
  delete seasons[year]; delete matches[year];
  delete players[year]; delete schedules[year];
  saveData();
  alert(`🗑 ${year} Season Cleared.`);
  renderEverything();
}

function setWinner() {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season yet!");
  const winner = prompt(`Enter winner for ${year}:`);
  if (!winner) return;
  seasons[year].winner = winner;
  saveData();
  alert(`🏆 ${winner} set as ${year} Champion!`);
  renderEverything();
}

setupSeasonBtn.onclick = setupNewSeason;
editTeamsBtn.onclick = editTeams;
clearSeasonBtn.onclick = clearSeason;
setWinnerBtn.onclick = setWinner;

// ================= MATCHES =================
function renderMatches() {
  const list = document.querySelector(".match-list");
  const year = currentYear();
  const arr = matches[year] || [];
  list.innerHTML = arr.map((m, i) => `
    <p><strong>${m.teamA}</strong> ${m.scoreA}-${m.scoreB} <strong>${m.teamB}</strong>
    ${isAdmin ? `<button class="editMatchBtn" data-i="${i}">✏️</button> 
    <button class="delMatchBtn" data-i="${i}">❌</button>` : ""}</p>
  `).join("") || "<p>No matches yet.</p>";
}
function addMatch() {
  const year = currentYear();
  const teamA = prompt("Team A:"), teamB = prompt("Team B:");
  const scoreA = +prompt(`${teamA} score:`), scoreB = +prompt(`${teamB} score:`);
  if (!teamA || !teamB) return;
  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });
  saveData();
  renderMatches(); renderStandings();
}
function editMatch(i) {
  const year = currentYear();
  const m = matches[year][i];
  const scoreA = +prompt(`${m.teamA} score:`, m.scoreA);
  const scoreB = +prompt(`${m.teamB} score:`, m.scoreB);
  matches[year][i] = { ...m, scoreA, scoreB };
  saveData(); renderMatches(); renderStandings();
}
function delMatch(i) {
  const year = currentYear();
  if (!confirm("Delete match?")) return;
  matches[year].splice(i, 1);
  saveData(); renderMatches(); renderStandings();
}
document.getElementById("addMatchBtn").onclick = addMatch;
document.querySelector(".match-list").onclick = e => {
  if (e.target.classList.contains("editMatchBtn")) editMatch(e.target.dataset.i);
  if (e.target.classList.contains("delMatchBtn")) delMatch(e.target.dataset.i);
};

// ================= STANDINGS =================
function calcStandings() {
  const year = currentYear(), s = seasons[year];
  if (!s) return { A: [], B: [] };
  const table = {};
  [...s.groupA, ...s.groupB].forEach(t => table[t] = { MP:0,W:0,L:0,T:0,GF:0,GA:0,P:0 });
  (matches[year] || []).forEach(m => {
    if (!table[m.teamA] || !table[m.teamB]) return;
    const A = table[m.teamA], B = table[m.teamB];
    A.MP++; B.MP++; A.GF+=m.scoreA; B.GF+=m.scoreB; A.GA+=m.scoreB; B.GA+=m.scoreA;
    if (m.scoreA>m.scoreB){A.W++;B.L++;} else if (m.scoreA<m.scoreB){B.W++;A.L++;} else {A.T++;B.T++;}
  });
  for (const t in table) table[t].P = 3*table[t].W + table[t].T;
  return { A: s.groupA.map(t => ({ team:t, ...table[t] })), B: s.groupB.map(t => ({ team:t, ...table[t] })) };
}
function renderStandings() {
  const { A, B } = calcStandings();
  const render = data => `
    <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th>T</th><th>GF</th><th>GA</th><th>P</th></tr>
    ${data.map(d=>`<tr><td>${d.team}</td><td>${d.MP}</td><td>${d.W}</td><td>${d.L}</td><td>${d.T}</td><td>${d.GF}</td><td>${d.GA}</td><td>${d.P}</td></tr>`).join("")}`;
  document.getElementById("groupA-table").innerHTML = render(A);
  document.getElementById("groupB-table").innerHTML = render(B);
}

// ================= INITIAL RENDER =================
async function renderEverything() {
  await loadData();
  renderOverview();
  renderMatches();
  renderStandings();
}
yearDropdown.onchange = renderEverything;
window.addEventListener("load", renderEverything);

