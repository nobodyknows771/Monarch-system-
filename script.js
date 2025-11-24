const bgm = document.getElementById('bgm');
const clickSfx = document.getElementById('clickSfx');
const levelUpSfx = document.getElementById('levelUpSfx');
const ashbornVoice = document.getElementById('ashbornVoice');

let bgmOn = true, sfxOn = true;

// Toggle sounds
document.getElementById('muteBgm').onclick = () => {
  bgmOn = !bgmOn;
  bgmOn ? bgm.play() : bgm.pause();
  document.getElementById('muteBgm').textContent = `BGM: ${bgmOn ? 'ON' : 'OFF'}`;
  playClick();
};

document.getElementById('muteSfx').onclick = () => {
  sfxOn = !sfxOn;
  document.getElementById('muteSfx').textContent = `SFX: ${sfxOn ? 'ON' : 'OFF'}`;
  playClick();
};

function playClick() {
  if (sfxOn) { clickSfx.currentTime = 0; clickSfx.play(); }
}

// Auto-play BGM on first interaction
document.body.addEventListener('click', () => {
  if (bgmOn && bgm.paused) bgm.play();
}, { once: true });

// Player System
let player = {
  gender: localStorage.getItem('gender') || null,
  level: parseInt(localStorage.getItem('level')) || 1,
  exp: parseInt(localStorage.getItem('exp')) || 0,
  expToNext: parseInt(localStorage.getItem('expToNext')) || 100,
  lastReset: localStorage.getItem('lastReset') || null,
  lastBossDefeated: localStorage.getItem('lastBoss') || null,
  completedToday: false,
  isMonarch: localStorage.getItem('isMonarch') === 'true'
};

function savePlayer() {
  localStorage.setItem('gender', player.gender);
  localStorage.setItem('level', player.level);
  localStorage.setItem('exp', player.exp);
  localStorage.setItem('expToNext', player.expToNext);
  localStorage.setItem('lastReset', player.lastReset);
  localStorage.setItem('lastBoss', player.lastBossDefeated);
  localStorage.setItem('isMonarch', player.isMonarch);
}

// ExerciseDB API
async function fetchBodyweightExercises() {
  const exercises = [
    "push-up", "pull-up", "squat", "lunge", "burpee", 
    "mountain climber", "plank", "crunch", "dip", "jump squat"
  ];
  const randomExercises = exercises.sort(() => 0.5 - Math.random()).slice(0, 4);

  const promises = randomExercises.map(name =>
    fetch(`https://exercisedb.p.rapidapi.com/exercises/name/${name}`, {
      headers: {
        'x-rapidapi-key': 'GET_YOUR_OWN_FREE_KEY_AT_https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb', // Optional but better
      }
    }).then(r => r.json())
  );

  // Fallback if API fails
  const fallback = [
    {name:"Push-ups",reps:100,gifUrl:"https://i.imgur.com/lnF5T.png"},
    {name:"Air Squats",reps:100,gifUrl:"https://i.imgur.com/4p4q3.gif"},
    {name:"Sit-ups",reps:100,gifUrl:"https://i.imgur.com/8r8d2.gif"},
    {name:"Burpees",reps:50,gifUrl:"https://i.imgur.com/burpee.gif"}
  ];

  try {
    const results = await Promise.all(promises);
    return results.flat().filter(ex => ex.gifUrl).slice(0,4);
  } catch (e) {
    console.log("API down → using fallback");
    return fallback;
  }
}

let dailyQuests = [];

// Daily Reset
function checkDailyReset() {
  const today = new Date().toDateString();
  if (player.lastReset !== today) {
    player.completedToday = false;
    player.lastReset = today;
    savePlayer();
    loadDailyQuests();
  }
}

// Weekly Boss (Every Sunday)
function checkBossRaid() {
  const day = new Date().getDay(); // 0 = Sunday
  const last = player.lastBossDefeated;
  const banner = document.getElementById('bossRaidBanner');

  if (day === 0 && last !== new Date().toDateString()) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

document.getElementById('fightBoss').onclick = () => {
  playClick();
  if (confirm("Defeat Beru and claim 10x EXP?")) {
    const bonus = (250 + player.level * 50) * 10;
    player.exp += bonus;
    player.lastBossDefeated = new Date().toDateString();
    savePlayer();
    levelUpCheck();
    updatePlayerUI();
    alert(`BERU DEFEATED! +${bonus} EXP`);
    document.getElementById('bossRaidBanner').classList.add('hidden');
  }
};

// Load Daily Quests
async function loadDailyQuests() {
  const quests = await fetchBodyweightExercises();
  dailyQuests = quests.map(ex => ({
    name: ex.name || ex.name.toUpperCase(),
    reps: Math.floor(Math.random() * 50) + 50,
    gif: ex.gifUrl,
    done: false
  }));
  renderQuests();
}

function renderQuests() {
  const container = document.getElementById('questList');
  container.innerHTML = '';
  dailyQuests.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = `quest-item ${q.done ? 'completed' : ''}`;
    div.innerHTML = `
      <div>
        <strong>${q.name}</strong> × ${q.reps}
        <img src="${q.gif}" alt="${q.name}" class="exercise-gif" onerror="this.style.display='none'">
      </div>
      <input type="checkbox" class="quest-checkbox" ${q.done ? 'checked disabled' : ''}>
    `;
    div.querySelector('input').onchange = () => {
      playClick();
      q.done = true;
      div.classList.add('completed');
      if (dailyQuests.every(q => q.done)) {
        document.getElementById('completeQuest').style.opacity = '1';
        document.getElementById('completeQuest').style.pointerEvents = 'auto';
      }
    };
    container.appendChild(div);
  });
}

// Claim Reward
document.getElementById('completeQuest').onclick = () => {
  playClick();
  if (player.completedToday) return alert("Already claimed today!");

  let expGain = 250 + (player.level * 50);
  player.exp += expGain;
  player.completedToday = true;
  savePlayer();

  levelUpCheck();
  updatePlayerUI();
  alert(`Daily Quest Cleared! +${expGain} EXP`);
};

// Level Up Logic
function levelUpCheck() {
  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level++;
    player.expToNext = Math.floor(player.expToNext * 1.5);
    levelUpSfx.play();
    showLevelUp();

    // MONARCH AWAKENING AT LEVEL 50
    if (player.level === 50 && !player.isMonarch) {
      player.isMonarch = true;
      savePlayer();
      ashbornVoice.play();
      document.getElementById('ashbornAwaken').classList.remove('hidden');
      document.body.classList.add('monarch-mode');
      setTimeout(() => {
        document.getElementById('ashbornAwaken').classList.add('hidden');
      }, 7000);
    }
  }
}

function showLevelUp() {
  const popup = document.getElementById('levelUpPopup');
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 4000);
}

function updatePlayerUI() {
  document.getElementById('playerLevel').textContent = player.level;
  document.getElementById('playerExp').textContent = player.exp;
  document.getElementById('expToNext').textContent = player.expToNext;
  document.getElementById('playerRank').textContent = player.level >= 50 ? "SHADOW MONARCH" : 
                                                  player.level >= 30 ? "S-Rank" : 
                                                  player.level >= 20 ? "A-Rank" : "E-Rank";

  const percent = (player.exp / player.expToNext) * 100;
  document.getElementById('expFill').style.width = percent + '%';

  // Shadow Army Count
  const army = player.level >= 50 ? (player.level - 49) * 10 : 0;
  document.getElementById('armyCount').textContent = army;
}

// Timer
function startTimer() {
  setInterval(() => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(24,0,0,0);
    const diff = tomorrow - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    document.getElementById('timer').textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// Init
if (!player.gender) {
  document.getElementById('genderSelect').classList.add('active');
  document.querySelectorAll('.gender-card').forEach(card => {
    card.onclick = () => {
      playClick();
      player.gender = card.dataset.gender;
      document.getElementById('playerAvatar').src = `sources/${player.gender}-avatar.png`;
      savePlayer();
      document.getElementById('genderSelect').classList.remove('active');
      document.getElementById('mainScreen').classList.add('active');
      checkDailyReset();
      loadDailyQuests();
      updatePlayerUI();
      startTimer();
      checkBossRaid();
      bgm.play();
    };
  });
} else {
  document.getElementById('mainScreen').classList.add('active');
  document.getElementById('playerAvatar').src = `sources/${player.gender}-avatar.png`;
  if (player.isMonarch) document.body.classList.add('monarch-mode');
  checkDailyReset();
  loadDailyQuests();
  updatePlayerUI();
  startTimer();
  checkBossRaid();
}