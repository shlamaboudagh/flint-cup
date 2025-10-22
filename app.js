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

// =============== MATCHES ===================
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

document.getElementById("addMatchBtn").onclick = () => {
  const year = currentYear();
  const teamA = prompt("Team A:");
  const teamB = prompt("Team B:");
  const scoreA = +prompt(`${teamA} score:`) || 0;
  const scoreB = +prompt(`${teamB} score:`) || 0;
  if (!teamA || !teamB) return;
  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });
  saveToFirebase();
  renderMatches();
};

// =============== STANDINGS ===================
function calcStandings() {
  const year = currentYear();
  const s = seasons[year];
  if (!s) return { A: [], B: [] };
  const table = {};
  [...s.groupA, ...s.groupB].forEach(t => table[t] = { MP:0, W:0, L:0, T:0, GF:0, GA:0, P:0 });
  (matches[year] || []).forEach(m => {
    const A = table[m.teamA], B = table[m.teamB];
    if (!A || !B) return;
    A.MP++; B.MP++; A.GF+=m.scoreA; B.GF+=m.scoreB; A.GA+=m.scoreB; B.GA+=m.scoreA;
    if (m.scoreA>m.scoreB){A.W++;B.L++;} else if (m.scoreA<m.scoreB){B.W++;A.L++;} else {A.T++;B.T++;}
  });
  for (const t in table) table[t].P = 3*table[t].W + table[t].T;
  return { A: s.groupA.map(t=>({team:t,...table[t]})), B: s.groupB.map(t=>({team:t,...table[t]})) };
}

function renderStandings() {
  const {A,B}=calcStandings();
  const makeTable=d=>`
  <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th>T</th><th>GF</th><th>GA</th><th>P</th></tr>
  ${d.map(x=>`<tr><td class="team-link">${x.team}</td><td>${x.MP}</td><td>${x.W}</td><td>${x.L}</td><td>${x.T}</td><td>${x.GF}</td><td>${x.GA}</td><td>${x.P}</td></tr>`).join("")}`;
  document.getElementById("groupA-table").innerHTML=makeTable(A);
  document.getElementById("groupB-table").innerHTML=makeTable(B);
  document.querySelectorAll(".team-link").forEach(td=>{
    td.addEventListener("click",()=>{
      tabs.forEach(t=>t.classList.remove("active"));
      sections.forEach(s=>s.classList.remove("active"));
      document.querySelector('[data-tab="schedules"]').classList.add("active");
      document.getElementById("schedules").classList.add("active");
      renderSchedules(td.textContent);
    });
  });
}

// =============== SCHEDULES ===================
function parseDate(str, year) {
  const clean = str.replace(/(\d+)(st|nd|rd|th)/,"$1");
  const full = `${clean} ${year}`;
  const d = new Date(full);
  return isNaN(d)?new Date(0):d;
}

function renderSchedules(focusTeam="") {
  const year=currentYear();
  const data=schedules[year]||{};
  const cont=document.getElementById("schedulesContainer");
  cont.innerHTML="";
  if(!Object.keys(data).length){cont.innerHTML="<p>No schedules yet.</p>";return;}
  Object.keys(data).forEach(team=>{
    const div=document.createElement("div");
    div.className="team-schedule";
    div.innerHTML=`<h3 id="${team}">${team}</h3>`;
    const sorted=[...data[team]].sort((a,b)=>parseDate(a.date,year)-parseDate(b.date,year));
    sorted.forEach((g,i)=>{
      div.innerHTML+=`<p>${g.date} • ${g.time} • vs ${g.opponent} (${g.homeaway})
      ${isAdmin?`<button class="editGameBtn" data-team="${team}" data-i="${i}">✏️</button>
      <button class="delGameBtn" data-team="${team}" data-i="${i}">❌</button>`:""}</p>`;
    });
    cont.appendChild(div);
  });
  if(focusTeam){document.getElementById(focusTeam)?.scrollIntoView({behavior:"smooth"});}
}

function addGame(){
  const year=currentYear();
  const teamA=prompt("Home team:");
  const teamB=prompt("Away team:");
  const date=prompt("Date (e.g., March 14th):");
  const time=prompt("Time (e.g., 5:00 PM):");
  if(!teamA||!teamB||!date||!time)return;
  schedules[year]=schedules[year]||{};
  schedules[year][teamA]=schedules[year][teamA]||[];
  schedules[year][teamB]=schedules[year][teamB]||[];
  schedules[year][teamA].push({opponent:teamB,date,time,homeaway:"Home"});
  schedules[year][teamB].push({opponent:teamA,date,time,homeaway:"Away"});
  saveToFirebase();
  renderSchedules();
}

function editGame(team,i){
  const year=currentYear();
  const g=schedules[year][team][i];
  const newDate=prompt("Date:",g.date);
  const newTime=prompt("Time:",g.time);
  const newHomeAway=prompt("Home/Away:",g.homeaway);
  g.date=newDate;g.time=newTime;g.homeaway=newHomeAway;
  saveToFirebase();
  renderSchedules();
}

function delGame(team,i){
  const year=currentYear();
  const g=schedules[year][team][i];
  if(!confirm(`Delete game ${team} vs ${g.opponent}?`))return;
  schedules[year][team].splice(i,1);
  const oppList=schedules[year][g.opponent];
  if(oppList){
    const idx=oppList.findIndex(x=>x.opponent===team&&x.date===g.date&&x.time===g.time);
    if(idx!==-1)oppList.splice(idx,1);
  }
  saveToFirebase();
  renderSchedules();
}

document.getElementById("addGameBtn").onclick=addGame;
document.getElementById("schedulesContainer").addEventListener("click",e=>{
  const b=e.target;
  if(b.classList.contains("editGameBtn"))editGame(b.dataset.team,b.dataset.i);
  if(b.classList.contains("delGameBtn"))delGame(b.dataset.team,b.dataset.i);
});

// =============== PLAYERS ===================
function renderPlayers(){
  const list=document.querySelector(".player-list");
  const year=currentYear();
  const arr=players[year]||[];
  list.innerHTML=arr.map((p,i)=>`
    <p><strong>${p.name}</strong> (${p.team}) — ⚽ ${p.goals} | 🎯 ${p.assists}
    ${isAdmin?`<button class="editPlayerBtn" data-i="${i}">✏️</button>
    <button class="delPlayerBtn" data-i="${i}">❌</button>`:""}</p>`).join("")||"<p>No players yet.</p>";
}

document.getElementById("addPlayerBtn").onclick=()=>{
  const year=currentYear();
  const name=prompt("Name:");const team=prompt("Team:");
  const goals=+prompt("Goals:")||0;const assists=+prompt("Assists:")||0;
  if(!name||!team)return;
  players[year]=players[year]||[];
  players[year].push({name,team,goals,assists});
  saveToFirebase();
  renderPlayers();
};

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
