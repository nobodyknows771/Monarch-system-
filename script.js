/* ==========================
      SOUND SYSTEM
=========================== */

const bgm = document.getElementById("bgm");
const clickSound = document.getElementById("clickSound");
const levelUpSound = document.getElementById("levelUpSound");

let sfxEnabled = true;
let bgmEnabled = false;

document.getElementById("toggleBGM").onclick = () => {
    bgmEnabled = !bgmEnabled;
    bgmEnabled ? bgm.play() : bgm.pause();
};

document.getElementById("toggleSFX").onclick = () => {
    sfxEnabled = !sfxEnabled;
};

function playClick() {
    if (sfxEnabled) clickSound.play();
}

/* ==========================
      AVATAR SWITCHING
=========================== */
const avatar = document.getElementById("current-avatar");
document.getElementById("switch-avatar").onclick = () => {
    playClick();
    avatar.src = avatar.src.includes("male-avatar") ?
        "sources/female-avatar.png" :
        "sources/male-avatar.png";
};

/* ==========================
      DAILY QUESTS SYSTEM
=========================== */

const quests = [
    "Do 30 push-ups",
    "Run for 10 minutes",
    "Hold plank for 1 minute",
    "20 Squats",
    "Drink 1 liter of water"
];

let xp = localStorage.getItem("xp") ? Number(localStorage.getItem("xp")) : 0;
document.getElementById("xp-display").textContent = `XP: ${xp}`;

function loadQuests() {
    const list = document.getElementById("quest-list");
    list.innerHTML = "";

    quests.forEach((quest, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${quest}</span>
            <button data-id="${index}">Complete</button>
        `;
        list.appendChild(li);
    });
}

document.getElementById("quest-list").onclick = (e) => {
    if (e.target.tagName === "BUTTON") {
        playClick();
        const li = e.target.parentElement;

        if (!li.classList.contains("completed")) {
            li.classList.add("completed");
            xp += 50;
            localStorage.setItem("xp", xp);
            document.getElementById("xp-display").textContent = `XP: ${xp}`;
            levelUpSound.play();
        }
    }
};

document.getElementById("reset-quests").onclick = () => {
    playClick();
    loadQuests();
};

loadQuests();

/* ==========================
      EXERCISE API FETCH
=========================== */

const exerciseContainer = document.getElementById("exercise-container");
const muscleSelect = document.getElementById("muscle-select");

async function fetchExercises(muscle) {
    exerciseContainer.innerHTML = "<p>Loading...</p>";

    const res = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/target/${muscle}`,
        {
            headers: {
                "x-rapidapi-key": "902379b81fmsh4338521f512f41bp1d8813jsnf077dc7ae54a",
                "x-rapidapi-host": "exercisedb.p.rapidapi.com"
            }
        }
    );

    const data = await res.json();
    exerciseContainer.innerHTML = "";

    data.slice(0, 12).forEach(ex => {
        const card = document.createElement("div");
        card.className = "exercise-card";

        card.innerHTML = `
            <h3>${ex.name.toUpperCase()}</h3>
            <img src="${ex.gifUrl}" alt="${ex.name}" />
            <p><strong>Equipment:</strong> ${ex.equipment}</p>
        `;

        exerciseContainer.appendChild(card);
    });
}

muscleSelect.addEventListener("change", () => {
    playClick();
    fetchExercises(muscleSelect.value);
});

// Load default
fetchExercises("chest");
