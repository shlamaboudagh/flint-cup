// ================= FLINT CUP (Firebase + Local Sync Final Version) ===================

// ✅ Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

window.addEventListener("DOMContentLoaded", () => {
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

  // =============== TAB NAVIGATION ===================
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
      editTeamsBtn.classList.add("hidden");
      setWinnerBtn.classList.add("hidden");
      clearSeasonBtn.classList.add("hidden");
      return;
    }

    if (isAdmin) {
      setupSeasonBtn.classList.add("hidden");
      editTeamsBtn.classList.remove("hidden");
      setWinnerBtn.classList.remove("hidden");
      clearSeasonBtn.classList.remove("hidden");
    } else {
      setupSeasonBtn.classList.add("hidden");
    }

    overviewContent.innerHTML = `
      <h3>Group A</h3><p>${data.groupA.join(", ")}</p>
      <h3>Group B</h3><p>${data.groupB.join(", ")}</p>
      ${data.winner ? `<h3>🏆 Winner: ${data.winner}</h3>` : ""}
    `;
  }

  // Setup buttons
  setupSeasonBtn.onclick = () => {
    const year = currentYear();
    if (seasons[year]) return alert(`${year} already exists.`);
    const groupA = [], groupB = [];
    const numA = +prompt("Number of teams in Group A:");
    for (let i = 1; i <= numA; i++) groupA.push(prompt(`Team ${i} (Group A):`));
    const numB = +prompt("Number of teams in Group B:");
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
    if (!confirm(`Delete all data for ${year}?`)) return;
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

  // =============== INITIAL RENDER ===================
  async function renderEverything() {
    await loadFromFirebase();
    renderOverview();
  }

  yearDropdown.onchange = renderEverything;
  renderEverything();
});
