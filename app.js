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

// Show admin-only controls if logged in
if (isAdmin) {
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.remove("hidden");
  });
}

let seasons = {};
let matches = {};
let players = {};
let schedules = {};

// =============== YEAR DROPDOWN SETUP ===================
const yearDropdown = document.getElementById("yearDropdown");
const overviewContent = document.getElementById("overviewContent");
const setupSeasonBtn = document.getElementById("setupSeasonBtn");
const editTeamsBtn = document.getElementById("editTeamsBtn");
const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const setWinnerBtn = document.getElementById("setWinnerBtn");
const seasonTitle = document.getElementById("seasonTitle");

// Populate years and remember last selected one
const years = [2026, 2027, 2028];
const savedYear = localStorage.getItem("selectedYear") || "2026";

years.forEach(y => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y == savedYear) opt.selected = true;
  yearDropdown.appendChild(opt);
});

// Helper: get current selected year
function currentYear() {
  return yearDropdown.value;
}

// =============== FIREBASE SYNC HELPERS ===================
async function loadFromFirebase() {
  try {
    const snapshot = await get(ref(db, "flintcup"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      if (data.seasons) seasons = data.seasons;
      if (data.matches) matches = data.matches;
      if (data.players) players = data.players;
      if (data.schedules) schedules = data.schedules;
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
    
    // 🔓 Show all admin-only elements
    document.querySelectorAll(".admin-only").forEach(e => e.classList.remove("hidden"));

    // 🔓 Also unhide the entire adminSeasonControls wrapper
    const adminControls = document.getElementById("adminSeasonControls");
    if (adminControls) adminControls.classList.remove("hidden");

    // 🧩 Remove the login button itself
    document.getElementById("admin-login").remove();

    // 🔁 Refresh and attach buttons
    renderEverything();
    attachAdminButtons(); // <-- important to reattach click handlers
  } else {
    alert("❌ Incorrect code.");
  }
});

// =============== TAB NAVIGATION ===================
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const sections = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");

      if (tab.dataset.tab === "players") renderPlayers();
      if (tab.dataset.tab === "stats") renderStats();
      if (tab.dataset.tab === "schedules") renderSchedules();
      if (tab.dataset.tab === "playoffs") renderPlayoffs();
      if (tab.dataset.tab === "alltime") renderAllTime();
    });
  });
});

// ============= OVERVIEW =============
function renderOverview() {
  const year = currentYear();
  seasonTitle.textContent = `Spring ${year} Season`;
  const data = seasons[year];
  overviewContent.innerHTML = "";

  // Always show message if no season exists
  if (!data) {
    overviewContent.innerHTML = `<p>No Flint Cup data for ${year} yet.</p>`;
  } else {
    // ✅ Show groups & winner to everyone
    overviewContent.innerHTML = `
  <div class="groups">
    <div class="group">
      <h3>Group A</h3>
      <ul>${(data.groupA || []).map(t => `<li>${t}</li>`).join("") || "<li>None</li>"}</ul>
    </div>
    <div class="group">
      <h3>Group B</h3>
      <ul>${(data.groupB || []).map(t => `<li>${t}</li>`).join("") || "<li>None</li>"}</ul>
    </div>
  </div>
  ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
`;
  }

  // ✅ Only toggle buttons for admins
  if (isAdmin) {
    editTeamsBtn.classList.remove("hidden");
    setWinnerBtn.classList.remove("hidden");
    clearSeasonBtn.classList.remove("hidden");
    setupSeasonBtn.classList.remove("hidden");
  } else {
    editTeamsBtn.classList.add("hidden");
    setWinnerBtn.classList.add("hidden");
    clearSeasonBtn.classList.add("hidden");
    setupSeasonBtn.classList.add("hidden");
  }

  attachAdminButtons();
}

function setupNewSeason() {
  console.log("🧩 Edit Teams button clicked"); // debug log
  const year = currentYear();
  if (seasons[year]) return alert(`${year} already exists.`);
  const groupA = [], groupB = [];
  const numA = parseInt(prompt("How many teams in Group A?"));
  for (let i = 1; i <= numA; i++) groupA.push(prompt(`Team ${i} (Group A):`));
  const numB = parseInt(prompt("How many teams in Group B?"));
  for (let i = 1; i <= numB; i++) groupB.push(prompt(`Team ${i} (Group B):`));
  seasons[year] = { groupA, groupB };
  saveToFirebase();
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
  saveToFirebase();
  alert(`✅ ${year} Teams Updated!`);
  renderEverything();
}

function clearSeason() {
  const year = currentYear();
  if (!confirm(`Delete ALL data for ${year}?`)) return;
  delete seasons[year]; delete matches[year]; delete players[year]; delete schedules[year];
  saveToFirebase();
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
  saveToFirebase();
  alert(`🏆 ${winner} set as ${year} Champion!`);
}

  function attachAdminButtons() {
  const setupSeasonBtn  = document.getElementById("setupSeasonBtn");
  const editTeamsBtn    = document.getElementById("editTeamsBtn");
  const clearSeasonBtn  = document.getElementById("clearSeasonBtn");
  const setWinnerBtn    = document.getElementById("setWinnerBtn");

  if (setupSeasonBtn) setupSeasonBtn.onclick = setupNewSeason;
  if (editTeamsBtn)   editTeamsBtn.onclick   = editTeams;
  if (clearSeasonBtn) clearSeasonBtn.onclick = clearSeason;
  if (setWinnerBtn)   setWinnerBtn.onclick   = setWinner;
}

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

function addMatch() {
  const year = currentYear();
  const teamA = prompt("Team A:"), teamB = prompt("Team B:");
  const scoreA = +prompt(`${teamA} score:`), scoreB = +prompt(`${teamB} score:`);
  if (!teamA || !teamB) return;
  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });
  saveToFirebase();
  renderMatches();
  renderStandings();
  saveToFirebase();
}

function editMatch(i) {
  const year = currentYear();
  const m = matches[year][i];
  const scoreA = +prompt(`${m.teamA} score:`, m.scoreA);
  const scoreB = +prompt(`${m.teamB} score:`, m.scoreB);
  matches[year][i] = { ...m, scoreA, scoreB };
  saveToFirebase();
  renderMatches(); renderStandings();
}

function delMatch(i) {
  const year = currentYear();
  if (!confirm("Delete match?")) return;
  matches[year].splice(i, 1);
  saveToFirebase();
  renderMatches(); renderStandings();
}

document.getElementById("addMatchBtn").onclick = addMatch;
document.querySelector(".match-list").onclick = e => {
  if (e.target.classList.contains("editMatchBtn")) editMatch(e.target.dataset.i);
  if (e.target.classList.contains("delMatchBtn")) delMatch(e.target.dataset.i);
};

// =============== CALCULATE STANDINGS ===============
function calcStandings() {
  const year = currentYear();
  const data = seasons[year];
  const arr = matches[year] || [];

  // If there’s no season yet, return empty arrays
  if (!data) return { A: [], B: [] };

  const allTeams = [...(data.groupA || []), ...(data.groupB || [])];
  const stats = {};

  // Initialize stats for each team
  allTeams.forEach(team => {
    stats[team] = { team, MP: 0, W: 0, L: 0, T: 0, GF: 0, GA: 0, P: 0 };
  });

  // Go through all matches in the selected season
  arr.forEach(m => {
    if (!stats[m.teamA] || !stats[m.teamB]) return;
    if (m.scoreA == null || m.scoreB == null) return;

    stats[m.teamA].MP++;
    stats[m.teamB].MP++;
    stats[m.teamA].GF += m.scoreA;
    stats[m.teamA].GA += m.scoreB;
    stats[m.teamB].GF += m.scoreB;
    stats[m.teamB].GA += m.scoreA;

    if (m.scoreA > m.scoreB) {
      stats[m.teamA].W++;
      stats[m.teamA].P += 3;
      stats[m.teamB].L++;
    } else if (m.scoreB > m.scoreA) {
      stats[m.teamB].W++;
      stats[m.teamB].P += 3;
      stats[m.teamA].L++;
    } else {
      stats[m.teamA].T++;
      stats[m.teamB].T++;
      stats[m.teamA].P++;
      stats[m.teamB].P++;
    }
  });

  // Build ordered arrays for each group
  const A = (data.groupA || []).map(t => stats[t] || { team: t, MP: 0, W: 0, L: 0, T: 0, GF: 0, GA: 0, P: 0 });
  const B = (data.groupB || []).map(t => stats[t] || { team: t, MP: 0, W: 0, L: 0, T: 0, GF: 0, GA: 0, P: 0 });

  return { A, B };
}

// =============== STANDINGS ===================
function renderStandings() {
  console.log("📊 Rendering standings for:", currentYear(), seasons[currentYear()]);
  const { A, B } = calcStandings();

  // 🏅 Sort by points → goal diff → goals for
  const sortTeams = arr =>
    arr.sort((a, b) =>
      b.P - a.P || (b.GF - b.GA) - (a.GF - a.GA) || b.GF - a.GF
    );

  const renderTable = data => `
    <tr>
      <th>Team</th><th>MP</th><th>W</th><th>L</th>
      <th>T</th><th>GF</th><th>GA</th><th>P</th>
    </tr>
    ${sortTeams(data)
      .map(d => `
        <tr>
          <td><button class="teamLink" data-team="${d.team}">${d.team}</button></td>
          <td>${d.MP}</td>
          <td>${d.W}</td>
          <td>${d.L}</td>
          <td>${d.T}</td>
          <td>${d.GF}</td>
          <td>${d.GA}</td>
          <td>${d.P}</td>
        </tr>`)
      .join("")}
  `;

  document.getElementById("groupA-table").innerHTML = renderTable(A);
  document.getElementById("groupB-table").innerHTML = renderTable(B);
}

// =============== PLAYOFFS ===================
function renderPlayoffs() {
  const year = currentYear();
  const data = seasons[year]?.playoffs;
  const div = document.getElementById("playoffsContent");

  if (!div) return; // safety

  if (!data) {
    div.innerHTML = "<p>No playoffs yet.</p>";
    if (isAdmin) document.getElementById("generatePlayoffsBtn").classList.remove("hidden");
    return;
  }

  document.getElementById("generatePlayoffsBtn").classList.add("hidden");

  const { semi1, semi2, final } = data;

  const semiLine = (s, label) => `
    ${label}: ${s.teamA}
    ${s.scoreA !== null && s.scoreB !== null ? `${s.scoreA}-${s.scoreB}` : ""}
    ${s.teamB}
  `;

  div.innerHTML = `
    <h3>Semifinals</h3>
    <p>${semiLine(semi1, "SF1")} ${isAdmin && (semi1.scoreA == null || semi1.scoreB == null) ? `<button id="semi1ScoreBtn">Enter SF1 Score</button>` : ""}</p>
    <p>${semiLine(semi2, "SF2")} ${isAdmin && (semi2.scoreA == null || semi2.scoreB == null) ? `<button id="semi2ScoreBtn">Enter SF2 Score</button>` : ""}</p>

    ${final ? `
      <h3>Final</h3>
      <p>
        ${final.teamA}
        ${final.scoreA !== null && final.scoreB !== null ? `${final.scoreA}-${final.scoreB}` : ""}
        ${final.teamB}
      </p>
      ${isAdmin && (final.scoreA === null || final.scoreB === null)
        ? `<button id="finalScoreBtn">Enter Final Score</button>`
        : ""}
      ${seasons[year].winner
        ? `<h3>🏆 Champion: ${seasons[year].winner}</h3>`
        : ""}
      <div id="finalPlaceholder"></div>
    ` : ""}
  `;

  // Show “Set Final Winner” only when a final exists
  const setBtn = document.getElementById("setFinalWinnerBtn");
  if (isAdmin && data.final) setBtn.classList.remove("hidden");
  else setBtn.classList.add("hidden");
}

function generatePlayoffs() {
  const year = currentYear();
  const A = calcStandings().A;
  const B = calcStandings().B;

  if (!A.length || !B.length) {
    return alert("Need completed standings for both groups before generating playoffs.");
  }

  // Top 2 from each group advance
  const semi1 = { teamA: A[0].team, teamB: B[1].team, scoreA: null, scoreB: null };
  const semi2 = { teamA: B[0].team, teamB: A[1].team, scoreA: null, scoreB: null };

  seasons[year].playoffs = { semi1, semi2 };
  saveToFirebase();
  alert("✅ Playoffs generated!");
  renderPlayoffs();
}

function setFinalWinner() {
  const year = currentYear();
  const data = seasons[year]?.playoffs;
  if (!data?.final) return alert("No final match yet.");

  const winner = prompt("Enter final winner:");
  if (!winner) return;
  seasons[year].winner = winner;
  saveToFirebase();
  alert(`🏆 ${winner} is the ${year} Champion!`);
  renderPlayoffs();
}

// =============== PLAYERS ===================
function renderPlayers() {
  const list = document.querySelector(".player-list");
  const year = currentYear();
  const arr = players[year] || [];
  list.innerHTML = arr.map((p,i)=>`
    <p><strong>${p.name}</strong> (${p.team}) — ⚽ ${p.goals} | 🎯 ${p.assists} | 🟨 ${p.yellow} | 🟥 ${p.red}
    ${isAdmin ? `<button class="editPlayerBtn" data-i="${i}">✏️</button>
    <button class="delPlayerBtn" data-i="${i}">❌</button>` : ""}</p>
  `).join("") || "<p>No players yet.</p>";
}

function addPlayer() {
  const year = currentYear();

  // 🧩 Step-by-step prompts with clear labels
  const name = prompt("Player Name:");
  if (!name) return alert("⚠️ Name required.");

  const team = prompt("Team Name:");
  if (!team) return alert("⚠️ Team required.");

  const goals = +prompt("Goals scored (enter 0 if none):") || 0;
  const assists = +prompt("Assists (enter 0 if none):") || 0;
  const yellow = +prompt("Yellow cards (enter 0 if none):") || 0;
  const red = +prompt("Red cards (enter 0 if none):") || 0;

  players[year] = players[year] || [];
  players[year].push({ name, team, goals, assists, yellow, red });

  saveToFirebase();

  renderPlayers();
  renderStats();
  renderAllTime();

  console.log(`✅ Added player: ${name} (${team}) — G:${goals} A:${assists} Y:${yellow} R:${red}`);
  if (isAdmin) {
  document.getElementById("addPlayerBtn").classList.remove("hidden");
}
renderStats();
}

function editPlayer(i) {
  const year = currentYear();
  const p = players[year][i];
  p.name = prompt("Name:", p.name);
  p.team = prompt("Team:", p.team);
  p.goals = +prompt("Goals:", p.goals);
  p.assists = +prompt("Assists:", p.assists);
  p.yellow = +prompt("Yellows:", p.yellow);
  p.red = +prompt("Reds:", p.red);
  saveToFirebase();
  renderPlayers(); renderStats();
}

function delPlayer(i) {
  const year = currentYear();
  if (!confirm("Delete player?")) return;
  players[year].splice(i,1);
  saveToFirebase();
  renderPlayers(); renderStats();
}

document.getElementById("addPlayerBtn").onclick = addPlayer;
document.querySelector(".player-list").onclick = e => {
  if (e.target.classList.contains("editPlayerBtn")) editPlayer(e.target.dataset.i);
  if (e.target.classList.contains("delPlayerBtn")) delPlayer(e.target.dataset.i);
};

// =============== STATS ===================
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
    </div>
  `;
}

// =============== SCHEDULES ===================
// 🏆 Render Schedules (auto-sorted and correctly indexed)
function renderSchedules() {
  const year = currentYear();
  const data = schedules[year] || {};
  const cont = document.getElementById("schedulesContainer");
  cont.innerHTML = "";

  if (Object.keys(data).length === 0) {
    cont.innerHTML = "<p>No schedules yet.</p>";
    return;
  }

  // 🗓 Parse date strings like “March 14th” or “Mar 14”
  const parseDate = (str, year) => {
    const clean = str.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const full = `${clean} ${year}`;
    const d = new Date(full);
    return isNaN(d) ? new Date(0) : d;
  };

  Object.keys(data).forEach(team => {
    const div = document.createElement("div");
    div.className = "team-schedule";
    div.innerHTML = `<h3>${team}</h3>`;

    // Sort by date and rebuild array (keeping correct index)
    const sorted = [...data[team]]
      .map((g, idx) => ({ ...g, originalIndex: idx }))
      .sort((a, b) => parseDate(a.date, year) - parseDate(b.date, year));

    sorted.forEach(g => {
      div.innerHTML += `
        <p>${g.date} • ${g.time} • vs ${g.opponent} (${g.homeaway})
        ${isAdmin ? `
          <button class="editGameBtn" data-team="${team}" data-i="${g.originalIndex}">✏️</button>
          <button class="delGameBtn" data-team="${team}" data-i="${g.originalIndex}">❌</button>
        ` : ""}</p>`;
    });

    cont.appendChild(div);
  });

  // 🧭 Team link click handler
  document.querySelectorAll(".teamLink").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamName = btn.dataset.team;
      document.querySelectorAll(".tab-button").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));

      // Activate schedules tab
      document.querySelector('[data-tab="schedules"]').classList.add("active");
      document.getElementById("schedules").classList.add("active");

      renderSchedules();

      const teamDiv = [...document.querySelectorAll(".team-schedule")].find(div =>
        div.querySelector("h3")?.textContent === teamName
      );
      if (teamDiv) {
        teamDiv.scrollIntoView({ behavior: "smooth", block: "start" });
        teamDiv.style.boxShadow = "0 0 15px 3px rgba(255,203,5,0.8)";
        setTimeout(() => (teamDiv.style.boxShadow = ""), 2000);
      }
    });
  });
}

// ✏️ Edit Game (updates both teams)
function editGame(team, i) {
  const year = currentYear();
  const g = schedules[year][team][i];
  if (!g) return alert("Could not find game data.");

  const newOpponent = prompt("Opponent:", g.opponent);
  const newDate = prompt("Date:", g.date);
  const newTime = prompt("Time:", g.time);
  const newHomeAway = prompt("Home/Away:", g.homeaway);

  // Update for this team
  schedules[year][team][i] = { opponent: newOpponent, date: newDate, time: newTime, homeaway: newHomeAway };

  // Update for the opponent’s schedule too (mirror changes)
  const oppTeam = newOpponent;
  const oppList = schedules[year][oppTeam];
  if (oppList) {
    const oppIndex = oppList.findIndex(gm => gm.opponent === team && gm.date === g.date && gm.time === g.time);
    if (oppIndex !== -1) {
      oppList[oppIndex] = { opponent: team, date: newDate, time: newTime, homeaway: newHomeAway === "Home" ? "Away" : "Home" };
    }
  }

  saveToFirebase();
  renderSchedules();
  alert(`✅ Updated game between ${team} and ${newOpponent}`);
}

function delGame(team, i) {
  const year = currentYear();
  const g = schedules[year][team][i];
  if (!g) return alert("Could not find game data.");
  if (!confirm(`Delete this game (${team} vs ${g.opponent})?`)) return;

  const opponent = g.opponent;

  // 🗑 Remove game from this team's list
  schedules[year][team].splice(i, 1);
  if (schedules[year][team].length === 0) delete schedules[year][team];

  // 🗑 Remove game from opponent's list (case-insensitive match)
  const oppList = schedules[year][opponent];
  if (oppList) {
    const oppIndex = oppList.findIndex(
      gm =>
        gm.opponent.toLowerCase() === team.toLowerCase() &&
        gm.date.trim().toLowerCase() === g.date.trim().toLowerCase() &&
        gm.time.trim().toLowerCase() === g.time.trim().toLowerCase()
    );
    if (oppIndex !== -1) {
      oppList.splice(oppIndex, 1);
      if (oppList.length === 0) delete schedules[year][opponent];
    }
  }

  // 🧩 Save updates
  saveToFirebase();
  renderSchedules();
  alert(`🗑 Deleted game between ${team} and ${opponent} for both teams`);
}

// 🏟 Add Game (adds to both team schedules)
function addGame() {
  const year = currentYear();
  const teamA = prompt("Home team:");
  const teamB = prompt("Away team:");
  const date = prompt("Date (e.g., March 14th):");
  const time = prompt("Time (e.g., 5:00 PM):");

  if (!teamA || !teamB || !date || !time) return alert("All fields required.");

  schedules[year] = schedules[year] || {};

  // Add to Team A (home)
  schedules[year][teamA] = schedules[year][teamA] || [];
  schedules[year][teamA].push({ opponent: teamB, date, time, homeaway: "Home" });

  // Add to Team B (away)
  schedules[year][teamB] = schedules[year][teamB] || [];
  schedules[year][teamB].push({ opponent: teamA, date, time, homeaway: "Away" });

  saveToFirebase();
  
  // Sort schedules by date for each team
for (const t in schedules[year]) {
  schedules[year][t].sort((a, b) => {
    const da = new Date(a.date + " " + year);
    const db = new Date(b.date + " " + year);
    return da - db;
  });
}
saveToFirebase();
renderSchedules();
alert(`✅ Game added for both ${teamA} and ${teamB}, sorted by date`);
}

document.getElementById("addGameBtn").onclick = addGame;
document.getElementById("schedulesContainer").onclick = e => {
  if (e.target.classList.contains("editGameBtn")) editGame(e.target.dataset.team, e.target.dataset.i);
  if (e.target.classList.contains("delGameBtn")) delGame(e.target.dataset.team, e.target.dataset.i);
};

// =============== ALL-TIME ===================
function renderAllTime() {
  const list = document.querySelector(".alltime-list");
  list.innerHTML = "";
  let combined = {};
  for (const year in players) {
    (players[year] || []).forEach(p => {
      if (!combined[p.name]) {
        combined[p.name] = { ...p, totalGoals: p.goals, totalAssists: p.assists, totalYellow: p.yellow, totalRed: p.red };
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
    return `<h4>${icon} ${title}</h4>${top.leaders.map(p => `<p><strong>${p.name}</strong> (${p.team}) — ${top.max}</p>`).join("")}`;
  };
  const winners = Object.entries(seasons)
    .filter(([_, s]) => s.winner)
    .map(([year, s]) => `<p><strong>${year}:</strong> ${s.winner}</p>`)
    .join("") || "<p>No winners recorded yet.</p>";
  renderStats();
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

// 🏆 Playoff Helper Functions =========================
function enterSemiScore(which) {
  const year = currentYear();
  const po = seasons[year]?.playoffs;
  if (!po) return alert("No playoffs yet.");

  const key = which === 1 ? "semi1" : "semi2";
  const s = po[key];

  const a = prompt(`${s.teamA} score:`); if (a === null) return;
  const b = prompt(`${s.teamB} score:`); if (b === null) return;

  const scoreA = Number(a), scoreB = Number(b);
  if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return alert("Enter valid numbers.");

  s.scoreA = scoreA; s.scoreB = scoreB;

  // If both semis have scores, create the Final automatically
  if (po.semi1.scoreA != null && po.semi1.scoreB != null &&
      po.semi2.scoreA != null && po.semi2.scoreB != null) {

    const w1 = po.semi1.scoreA > po.semi1.scoreB ? po.semi1.teamA
             : po.semi1.scoreB > po.semi1.scoreA ? po.semi1.teamB
             : prompt("SF1 was a tie. Who advanced on PKs?", po.semi1.teamA);

    const w2 = po.semi2.scoreA > po.semi2.scoreB ? po.semi2.teamA
             : po.semi2.scoreB > po.semi2.scoreA ? po.semi2.teamB
             : prompt("SF2 was a tie. Who advanced on PKs?", po.semi2.teamA);

    seasons[year].playoffs.final = { teamA: w1, teamB: w2, scoreA: null, scoreB: null };
    alert(`✅ Final created: ${w1} vs ${w2}`);
  }

  saveToFirebase();
  renderPlayoffs();
}

function enterFinalScore() {
  const year = currentYear();
  const fin = seasons[year]?.playoffs?.final;
  if (!fin) return alert("No final match yet.");

  const a = prompt(`${fin.teamA} score:`); if (a === null) return;
  const b = prompt(`${fin.teamB} score:`); if (b === null) return;

  const scoreA = Number(a), scoreB = Number(b);
  if (Number.isNaN(scoreA) || Number.isNaN(scoreB)) return alert("Enter valid numbers.");

  fin.scoreA = scoreA; fin.scoreB = scoreB;

  let winner;
  if (scoreA > scoreB) winner = fin.teamA;
  else if (scoreB > scoreA) winner = fin.teamB;
  else winner = prompt("Final is tied. Who won on PKs?", fin.teamA);

  if (winner) seasons[year].winner = winner;

  saveToFirebase();
  renderPlayoffs();
}

// 🎯 Playoffs dynamic buttons (inside content div)
document.getElementById("playoffsContent")?.addEventListener("click", (e) => {
  if (!(e.target instanceof HTMLElement)) return;
  if (e.target.id === "semi1ScoreBtn") enterSemiScore(1);
  if (e.target.id === "semi2ScoreBtn") enterSemiScore(2);
  if (e.target.id === "finalScoreBtn") enterFinalScore();
});

// =============== INITIAL RENDER ===================
async function renderEverything() {
  console.log("🔄 Rendering everything...");
  await loadFromFirebase(); // wait for Firebase data

  renderOverview();
  renderMatches();
  renderStandings();
  renderPlayers();
  renderStats();
  renderSchedules();
  renderAllTime();
  renderPlayoffs();

  console.log("✅ All sections rendered.");
}

// 🌀 Re-render when year changes
yearDropdown.addEventListener("change", () => {
  renderEverything();
});

// 🧠 Attach ALL button handlers once page loads
window.addEventListener("load", async () => {
  await renderEverything();
  renderMatches();

  // ===== ADMIN CONTROLS =====
  attachAdminButtons();

  // ===== PLAYER CONTROLS =====
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  if (addPlayerBtn) {
    addPlayerBtn.onclick = addPlayer;
    console.log("🎯 Connected Add Player Button");
  }

  const playerList = document.querySelector(".player-list");
  if (playerList) {
    playerList.onclick = e => {
      if (e.target.classList.contains("editPlayerBtn")) editPlayer(e.target.dataset.i);
      if (e.target.classList.contains("delPlayerBtn")) delPlayer(e.target.dataset.i);
    };
  }

  // ===== MATCH CONTROLS =====
  const addMatchBtn = document.getElementById("addMatchBtn");
  if (addMatchBtn) addMatchBtn.onclick = addMatch;

  const matchList = document.querySelector(".match-list");
  if (matchList) {
    matchList.onclick = e => {
      if (e.target.classList.contains("editMatchBtn")) editMatch(e.target.dataset.i);
      if (e.target.classList.contains("delMatchBtn")) delMatch(e.target.dataset.i);
    };
  }

  // ===== PLAYOFF CONTROLS =====
  const genBtn = document.getElementById("generatePlayoffsBtn");
  const setWinnerBtn = document.getElementById("setFinalWinnerBtn");
  if (genBtn) genBtn.onclick = generatePlayoffs;
  if (setWinnerBtn) setWinnerBtn.onclick = setFinalWinner;

  console.log("✅ All buttons connected successfully.");
  renderEverything();
});
















