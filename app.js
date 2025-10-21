// ===== Global Variables =====
let isAdmin = false;
let currentSeason = {};
let seasons = JSON.parse(localStorage.getItem("seasons")) || {};
let matches = JSON.parse(localStorage.getItem("matches")) || {};
let players = JSON.parse(localStorage.getItem("players")) || {};
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};

const yearDropdown = document.getElementById("yearDropdown");
const overviewContent = document.getElementById("overviewContent");
const adminSeasonControls = document.getElementById("adminSeasonControls");
const setupSeasonBtn = document.getElementById("setupSeasonBtn");
const editTeamsBtn = document.getElementById("editTeamsBtn");
const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const seasonTitle = document.getElementById("seasonTitle");

const years = [2025, 2026, 2027];
years.forEach(y => {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  if (y === 2025) opt.selected = true;
  yearDropdown.appendChild(opt);
});

function currentYear() {
  return yearDropdown.value;
}

// ===== Admin Login =====
document.getElementById("admin-login").addEventListener("click", () => {
  const input = prompt("Enter admin code:");
  if (input === "flintadmin") {
    alert("✅ Admin access granted!");
    isAdmin = true;
    document.querySelectorAll(".admin-only").forEach(e => e.classList.remove("hidden"));
    document.getElementById("admin-login").remove();
    renderEverything();
  } else {
    alert("❌ Incorrect code.");
  }
});

// ===== Tabs =====
const tabs = document.querySelectorAll(".tab-button");
const sections = document.querySelectorAll(".tab-content");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    sections.forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function renderOverview() {
  const year = currentYear();
  seasonTitle.textContent = `Spring ${year} Season`;
  const data = seasons[year];
  overviewContent.innerHTML = "";

  if (!data) {
    overviewContent.innerHTML = `<p>No Flint Cup data for ${year} yet.</p>`;
    if (isAdmin) setupSeasonBtn.classList.remove("hidden");
    else setupSeasonBtn.classList.add("hidden");
    editTeamsBtn.classList.add("hidden");
    setWinnerBtn.classList.add("hidden");
    clearSeasonBtn.classList.add("hidden");
    return;
  }

  setupSeasonBtn.classList.add("hidden");

  if (isAdmin) {
    editTeamsBtn.classList.remove("hidden");
    setWinnerBtn.classList.remove("hidden");
    clearSeasonBtn.classList.remove("hidden");
  } else {
    editTeamsBtn.classList.add("hidden");
    setWinnerBtn.classList.add("hidden");
    clearSeasonBtn.classList.add("hidden");
  }

  overviewContent.innerHTML = `
    <h3>Group A</h3>
    <p>${data.groupA.join(", ")}</p>
    <h3>Group B</h3>
    <p>${data.groupB.join(", ")}</p>
    ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
  `;
}

function setupNewSeason() {
  const year = currentYear();
  if (seasons[year]) return alert(`${year} already exists.`);
  const groupA = [];
  const groupB = [];

  const numA = parseInt(prompt("How many teams in Group A?"));
  for (let i = 1; i <= numA; i++) {
    const name = prompt(`Enter name for Team ${i} in Group A:`);
    if (name) groupA.push(name);
  }

  const numB = parseInt(prompt("How many teams in Group B?"));
  for (let i = 1; i <= numB; i++) {
    const name = prompt(`Enter name for Team ${i} in Group B:`);
    if (name) groupB.push(name);
  }

  seasons[year] = { groupA, groupB };
  localStorage.setItem("seasons", JSON.stringify(seasons));
  alert(`✅ ${year} Season Created!`);
  renderEverything();
}

function editTeams() {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season yet.");
  let newA = [];
  let newB = [];

  alert("Re-enter updated Group A teams:");
  for (let i = 0; i < data.groupA.length; i++) {
    const t = prompt(`Team ${i + 1} (Group A):`, data.groupA[i]);
    if (t) newA.push(t);
  }

  alert("Re-enter updated Group B teams:");
  for (let i = 0; i < data.groupB.length; i++) {
    const t = prompt(`Team ${i + 1} (Group B):`, data.groupB[i]);
    if (t) newB.push(t);
  }

  seasons[year] = { groupA: newA, groupB: newB };
  localStorage.setItem("seasons", JSON.stringify(seasons));
  alert(`✅ ${year} Teams Updated!`);
  renderEverything();
}

function clearSeason() {
  const year = currentYear();
  if (!confirm(`Delete ALL data for ${year}?`)) return;
  delete seasons[year];
  delete matches[year];
  delete players[year];
  delete schedules[year];
  localStorage.setItem("seasons", JSON.stringify(seasons));
  localStorage.setItem("matches", JSON.stringify(matches));
  localStorage.setItem("players", JSON.stringify(players));
  localStorage.setItem("schedules", JSON.stringify(schedules));
  alert(`🗑 ${year} Season Cleared.`);
  renderEverything();
}

setupSeasonBtn.addEventListener("click", setupNewSeason);
editTeamsBtn.addEventListener("click", editTeams);
clearSeasonBtn.addEventListener("click", clearSeason);

function setWinner() {
  const year = currentYear();
  const data = seasons[year];
  if (!data) return alert("No season exists for this year yet!");
  const winner = prompt(`Enter the Flint Cup winner for ${year}:`);
  if (!winner) return;
  seasons[year].winner = winner;
  localStorage.setItem("seasons", JSON.stringify(seasons));
  alert(`🏆 ${winner} set as ${year} Flint Cup Champion!`);
  renderEverything();
}

document.getElementById("setWinnerBtn").addEventListener("click", setWinner);

// ===== Matches =====
function renderMatches() {
  const list = document.querySelector(".match-list");
  list.innerHTML = "";
  const year = currentYear();
  const arr = matches[year] || [];
  arr.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "match-entry";
    div.innerHTML = `
      <p><strong>${m.teamA}</strong> ${m.scoreA}-${m.scoreB} <strong>${m.teamB}</strong></p>
      ${isAdmin ? `
        <button class="editMatchBtn" data-i="${i}">✏️</button>
        <button class="delMatchBtn" data-i="${i}">❌</button>` : ""}
    `;
    list.appendChild(div);
  });
}

function addMatch() {
  const year = currentYear();
  const teamA = prompt("Team A:");
  const teamB = prompt("Team B:");
  const scoreA = parseInt(prompt(`${teamA} score:`));
  const scoreB = parseInt(prompt(`${teamB} score:`));
  if (!teamA || !teamB || isNaN(scoreA) || isNaN(scoreB)) return alert("All fields required.");
  matches[year] = matches[year] || [];
  matches[year].push({ teamA, teamB, scoreA, scoreB });
  localStorage.setItem("matches", JSON.stringify(matches));
  renderMatches();
  renderStandings();
}

function editMatch(i) {
  const year = currentYear();
  const m = matches[year][i];
  const scoreA = parseInt(prompt(`${m.teamA} score:`, m.scoreA));
  const scoreB = parseInt(prompt(`${m.teamB} score:`, m.scoreB));
  matches[year][i] = { ...m, scoreA, scoreB };
  localStorage.setItem("matches", JSON.stringify(matches));
  renderMatches();
  renderStandings();
}

function delMatch(i) {
  const year = currentYear();
  if (!confirm("Delete match?")) return;
  matches[year].splice(i, 1);
  localStorage.setItem("matches", JSON.stringify(matches));
  renderMatches();
  renderStandings();
}

document.getElementById("addMatchBtn").onclick = addMatch;
document.querySelector(".match-list").onclick = e => {
  if (e.target.classList.contains("editMatchBtn")) editMatch(e.target.dataset.i);
  if (e.target.classList.contains("delMatchBtn")) delMatch(e.target.dataset.i);
};

// ===== Standings =====
function calcStandings() {
  const year = currentYear();
  const s = seasons[year];
  if (!s) return { A: {}, B: {} };

  const table = {};
  [...s.groupA, ...s.groupB].forEach(t => table[t] = { MP:0, W:0, L:0, T:0, GF:0, GA:0, P:0 });

  (matches[year] || []).forEach(m => {
    if (!table[m.teamA] || !table[m.teamB]) return;
    const A = table[m.teamA], B = table[m.teamB];
    A.MP++; B.MP++;
    A.GF += m.scoreA; B.GF += m.scoreB;
    A.GA += m.scoreB; B.GA += m.scoreA;
    if (m.scoreA > m.scoreB) { A.W++; B.L++; }
    else if (m.scoreA < m.scoreB) { B.W++; A.L++; }
    else { A.T++; B.T++; }
  });

  for (const t in table) {
    const x = table[t];
    x.P = 3 * x.W + x.T;
  }
  return { A: s.groupA.map(t => ({ team:t, ...table[t] })), B: s.groupB.map(t => ({ team:t, ...table[t] })) };
}

function renderStandings() {
  const { A, B } = calcStandings();
  const groupA = document.getElementById("groupA-table");
  const groupB = document.getElementById("groupB-table");
  const render = (data) => `
    <tr><th>Team</th><th>MP</th><th>W</th><th>L</th><th>T</th><th>GF</th><th>GA</th><th>P</th></tr>
    ${data.map(d=>`<tr><td>${d.team}</td><td>${d.MP}</td><td>${d.W}</td><td>${d.L}</td><td>${d.T}</td><td>${d.GF}</td><td>${d.GA}</td><td>${d.P}</td></tr>`).join("")}`;
  groupA.innerHTML = render(A);
  groupB.innerHTML = render(B);
}

// ===== Players & Stats =====
function renderPlayers() {
  const list = document.querySelector(".player-list");
  const year = currentYear();
  const arr = players[year] || [];
  list.innerHTML = arr.map((p,i)=>`
    <p><strong>${p.name}</strong> (${p.team}) — ⚽ ${p.goals} | 🎯 ${p.assists} | 🟨 ${p.yellow} | 🟥 ${p.red}
    ${isAdmin ? `<button class="editPlayerBtn" data-i="${i}">✏️</button> <button class="delPlayerBtn" data-i="${i}">❌</button>` : ""}</p>
  `).join("") || "<p>No players yet.</p>";
}

function addPlayer() {
  const year = currentYear();
  const name = prompt("Name:");
  const team = prompt("Team:");
  const goals = +prompt("Goals:") || 0;
  const assists = +prompt("Assists:") || 0;
  const yellow = +prompt("Yellow cards:") || 0;
  const red = +prompt("Red cards:") || 0;
  if (!name || !team) return alert("Name & team required.");
  players[year] = players[year] || [];
  players[year].push({ name, team, goals, assists, yellow, red });
  localStorage.setItem("players", JSON.stringify(players));
  renderPlayers();
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
  localStorage.setItem("players", JSON.stringify(players));
  renderPlayers();
  renderStats();
}

function delPlayer(i) {
  const year = currentYear();
  if (!confirm("Delete player?")) return;
  players[year].splice(i,1);
  localStorage.setItem("players", JSON.stringify(players));
  renderPlayers();
  renderStats();
}

document.getElementById("addPlayerBtn").onclick = addPlayer;
document.querySelector(".player-list").onclick = e => {
  if (e.target.classList.contains("editPlayerBtn")) editPlayer(e.target.dataset.i);
  if (e.target.classList.contains("delPlayerBtn")) delPlayer(e.target.dataset.i);
};

// ===== Stats Leaderboard =====
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
  const build = (title, d, emoji) => d.max ? `${emoji} ${title}: <strong>${d.leaders.map(p=>p.name).join(", ")}</strong> — ${d.max}` : `${emoji} ${title}: No record yet.`;
  statsDiv.innerHTML = `
    <div class="leaderboard">
      <h3>🏆 Season Leaders (${year})</h3>
      <p>${build("Top Scorer", getTop("goals"), "⚽")}</p>
      <p>${build("Top Assister", getTop("assists"), "🎯")}</p>
      <p>${build("Most Yellow Cards", getTop("yellow"), "🟨")}</p>
      <p>${build("Most Red Cards", getTop("red"), "🟥")}</p>
    </div>`;
}

// ===== Schedules =====
function renderSchedules() {
  const year = currentYear();
  const data = schedules[year] || {};
  const cont = document.getElementById("schedulesContainer");
  cont.innerHTML = "";

  if (Object.keys(data).length === 0) {
    cont.innerHTML = "<p>No schedules yet.</p>";
    return;
  }

  Object.keys(data).forEach(team => {
    const div = document.createElement("div");
    div.className = "team-schedule";
    div.innerHTML = `<h3>${team}</h3>`;
    data[team].forEach((g, i) => {
      div.innerHTML += `
        <p>
          ${g.date} • ${g.time} • vs ${g.opponent} (${g.homeaway})
          ${isAdmin ? `
            <button class="editGameBtn" data-team="${team}" data-i="${i}">✏️</button>
            <button class="delGameBtn" data-team="${team}" data-i="${i}">❌</button>` : ""}
        </p>
      `;
    });
    cont.appendChild(div);
  });
}

function addGame() {
  const year = currentYear();
  const team = prompt("Team:");
  const opponent = prompt("Opponent:");
  const date = prompt("Date:");
  const time = prompt("Time:");
  const homeaway = prompt("Home/Away:");
  if (!team || !opponent || !date || !time || !homeaway) return alert("All fields required.");

  schedules[year] = schedules[year] || {};
  schedules[year][team] = schedules[year][team] || [];
  schedules[year][team].push({ opponent, date, time, homeaway });
  localStorage.setItem("schedules", JSON.stringify(schedules));
  renderSchedules();
}

function editGame(team, i) {
  const year = currentYear();
  const g = schedules[year][team][i];
  const opponent = prompt("Opponent:", g.opponent);
  const date = prompt("Date:", g.date);
  const time = prompt("Time:", g.time);
  const homeaway = prompt("Home/Away:", g.homeaway);
  schedules[year][team][i] = { opponent, date, time, homeaway };
  localStorage.setItem("schedules", JSON.stringify(schedules));
  renderSchedules();
}

function delGame(team, i) {
  const year = currentYear();
  if (!confirm("Delete this game?")) return;
  schedules[year][team].splice(i, 1);
  if (schedules[year][team].length === 0) delete schedules[year][team];
  localStorage.setItem("schedules", JSON.stringify(schedules));
  renderSchedules();
}

// ✅ Attach a single click listener for dynamically created buttons
document.getElementById("schedulesContainer").addEventListener("click", e => {
  if (e.target.classList.contains("editGameBtn")) {
    editGame(e.target.dataset.team, e.target.dataset.i);
  }
  if (e.target.classList.contains("delGameBtn")) {
    delGame(e.target.dataset.team, e.target.dataset.i);
  }
});

document.getElementById("addGameBtn").onclick = addGame;


// ===== Render Everything =====
function renderEverything() {
  renderOverview();
  renderMatches();
  renderStandings();
  renderPlayers();
  renderStats();
  renderSchedules();
}

yearDropdown.onchange = renderEverything;
window.addEventListener("load", renderEverything);

// ===== All-Time Records =====
function renderAllTime() {
  const list = document.querySelector(".alltime-list");
  list.innerHTML = "";

  let combined = {};

  // Combine players from all seasons
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

  // Helper function for top performers
  const getTop = (key) => {
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

  // Collect all past winners
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

// Render all-time stats when the tab is clicked
document.querySelector('[data-tab="alltime"]').addEventListener("click", renderAllTime);

