/* ==========================
   Monarch Training System - Script.js
   Solo Leveling Theme
=========================== */

/* --------------------------
   SOUND SYSTEM
--------------------------- */
const bgm = document.getElementById("bgm");
const clickSound = document.getElementById("clickSound");
const levelUpSound = document.getElementById("levelUpSound");
const questSound = document.getElementById("questSound");

let sfxEnabled = true;
let bgmEnabled = false;

// Sound controls
const toggleBGMBtn = document.getElementById("toggleBGM");
const toggleSFXBtn = document.getElementById("toggleSFX");

toggleBGMBtn?.addEventListener("click", () => {
    bgmEnabled = !bgmEnabled;
    if (bgmEnabled) bgm.play();
    else bgm.pause();
    playClick();
});

toggleSFXBtn?.addEventListener("click", () => {
    sfxEnabled = !sfxEnabled;
    playClick();
});

function playClick() { if(sfxEnabled) clickSound.play(); }
function playQuestSound() {
    if(sfxEnabled) {
        bgm.pause();
        questSound.play();
        questSound.onended = () => { if(bgmEnabled) bgm.play(); }
    }
}
function playLevelUp() { if(sfxEnabled) levelUpSound.play(); }

/* --------------------------
   LOCAL STORAGE UTILITIES
--------------------------- */
function saveToStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadFromStorage(key, defaultValue) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
}

/* --------------------------
   AVATAR UPLOAD
--------------------------- */
const avatarInput = document.createElement("input");
avatarInput.type = "file";
avatarInput.accept = "image/*";

const currentAvatar = document.getElementById("current-avatar");

currentAvatar?.addEventListener("click", () => {
    avatarInput.click();
});

avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = () => {
            currentAvatar.src = reader.result;
            saveToStorage("userAvatar", reader.result);
            playClick();
        };
        reader.readAsDataURL(file);
    }
});

// Load saved avatar
const savedAvatar = loadFromStorage("userAvatar", null);
if(savedAvatar && currentAvatar) currentAvatar.src = savedAvatar;

/* --------------------------
   XP / LEVEL / RANK SYSTEM
--------------------------- */
let xp = loadFromStorage("xp", 0);
let level = loadFromStorage("level", 1);
let stats = loadFromStorage("stats", {STR:5, AGI:5, VIT:5, INT:5});

const levelDisplay = document.getElementById("level-display");
const xpDisplay = document.getElementById("xp-display");
const rankDisplay = document.getElementById("rank-display");

function calculateRank(lvl) {
    if(lvl >= 100) return "National";
    if(lvl >= 80) return "S";
    if(lvl >= 60) return "A";
    if(lvl >= 40) return "B";
    if(lvl >= 20) return "C";
    if(lvl >= 10) return "D";
    return "E";
}

function updateXPUI() {
    levelDisplay && (levelDisplay.textContent = `Level: ${level}`);
    xpDisplay && (xpDisplay.textContent = `XP: ${xp}`);
    rankDisplay && (rankDisplay.textContent = `Rank: ${calculateRank(level)}`);
}

function gainXP(amount){
    xp += amount;
    while(xp >= level * 100){
        xp -= level * 100;
        level += 1;
        playLevelUp();
        alert(`Level Up! You are now level ${level}!`);
    }
    saveToStorage("xp", xp);
    saveToStorage("level", level);
    updateXPUI();
}

updateXPUI();

/* --------------------------
   DAILY QUESTS
--------------------------- */
const quests = loadFromStorage("quests", [
    {desc:"Do 30 push-ups", done:false, xp:50},
    {desc:"Run 10 minutes", done:false, xp:50},
    {desc:"Plank 1 min", done:false, xp:50},
    {desc:"20 squats", done:false, xp:50},
    {desc:"Drink 1 liter water", done:false, xp:50}
]);

const questList = document.getElementById("quest-list");
const resetQuestsBtn = document.getElementById("reset-quests");

function renderQuests(){
    if(!questList) return;
    questList.innerHTML = "";
    quests.forEach((q,i)=>{
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${q.desc}</span>
            <button data-index="${i}">${q.done ? "✔" : "Complete"}</button>
        `;
        if(q.done) li.classList.add("completed");
        questList.appendChild(li);
    });
}

questList?.addEventListener("click", e=>{
    if(e.target.tagName==="BUTTON"){
        const idx = e.target.dataset.index;
        if(!quests[idx].done){
            quests[idx].done = true;
            gainXP(quests[idx].xp);
            playQuestSound();
            saveToStorage("quests", quests);
            renderQuests();
        }
        playClick();
    }
});

resetQuestsBtn?.addEventListener("click", ()=>{
    quests.forEach(q=>q.done=false);
    saveToStorage("quests", quests);
    renderQuests();
    playClick();
});

renderQuests();

/* --------------------------
   EXERCISE LIBRARY
--------------------------- */
const muscleSelect = document.getElementById("muscle-select");
const exerciseContainer = document.getElementById("exercise-container");

// Fallback exercises (open source GIFs)
const fallbackExercises = [
    {name:"Push-Up", gifUrl:"https://raw.githubusercontent.com/ArseniyKhodakov/exercise-gifs/main/pushup.gif", equipment:"Bodyweight"},
    {name:"Squat", gifUrl:"https://raw.githubusercontent.com/ArseniyKhodakov/exercise-gifs/main/squat.gif", equipment:"Bodyweight"},
    {name:"Plank", gifUrl:"https://raw.githubusercontent.com/ArseniyKhodakov/exercise-gifs/main/plank.gif", equipment:"Bodyweight"},
    {name:"Bicep Curl", gifUrl:"https://raw.githubusercontent.com/ArseniyKhodakov/exercise-gifs/main/bicep.gif", equipment:"Dumbbell"},
];

// Fetch exercises from ExerciseDB API
async function fetchExercises(target="chest"){
    if(!exerciseContainer) return;
    exerciseContainer.innerHTML = "<p>Loading...</p>";

    try{
        const res = await fetch(`https://exercisedb.p.rapidapi.com/exercises/target/${target}`, {
            headers:{
                "x-rapidapi-key":"902379b81fmsh4338521f512f41bp1d8813jsnf077dc7ae54a",
                "x-rapidapi-host":"exercisedb.p.rapidapi.com"
            }
        });
        if(!res.ok) throw new Error("API error");
        const data = await res.json();
        renderExercises(data.slice(0,12));
    }catch(err){
        console.warn("Using fallback exercises", err);
        renderExercises(fallbackExercises);
    }
}

function renderExercises(list){
    if(!exerciseContainer) return;
    exerciseContainer.innerHTML = "";
    list.forEach(ex=>{
        const card = document.createElement("div");
        card.className = "exercise-card";
        card.innerHTML = `
            <h3>${ex.name.toUpperCase()}</h3>
            <img src="${ex.gifUrl}" alt="${ex.name}">
            <p><strong>Equipment:</strong> ${ex.equipment}</p>
        `;
        exerciseContainer.appendChild(card);
    });
}

muscleSelect?.addEventListener("change", ()=>{
    fetchExercises(muscleSelect.value);
    playClick();
});

// Load default muscle
if(muscleSelect) fetchExercises(muscleSelect.value || "chest");

/* --------------------------
   STATS PANEL (Optional page: stats.html)
--------------------------- */
function renderStats(){
    const statsDiv = document.getElementById("stats-panel");
    if(!statsDiv) return;
    statsDiv.innerHTML = "";
    Object.keys(stats).forEach(key=>{
        const stat = document.createElement("div");
        stat.className="stat";
        stat.innerHTML = `<strong>${key}:</strong> ${stats[key]}`;
        statsDiv.appendChild(stat);
    });
}

renderStats();
