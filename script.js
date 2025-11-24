// AUDIO
const bgm = document.getElementById('bgm');
const clickSfx = document.getElementById('clickSfx');
const levelUpSfx = document.getElementById('levelUpSfx');
const ashbornVoice = document.getElementById('ashbornVoice');
const gateOpen = document.getElementById('gateOpen');
const shadowExtract = document.getElementById('shadowExtract');

let bgmOn = true, sfxOn = true;

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

document.getElementById('resetData').onclick = () => {
  if (confirm("Reset ALL progress? This cannot be undone.")) {
    localStorage.clear();
    location.reload();
  }
};

function playClick() { if (sfxOn) { clickSfx.currentTime = 0; clickSfx.play(); } }
function playGate() { if (sfxOn) gateOpen.play(); }
function playExtract() { if (sfxOn) shadowExtract.play(); }

// PLAYER DATA
let player = {
  gender: localStorage.getItem('gender') || null,
  level: parseInt(localStorage.getItem('level')) || 1,
  exp: parseInt(localStorage.getItem('exp')) || 0,
  expToNext: parseInt(localStorage.getItem('expToNext')) || 100,
  lastReset: localStorage.getItem('lastReset') || null,
  lastBoss: localStorage.getItem('lastBoss') || null,
  shadows: JSON.parse(localStorage.getItem('shadows')) || [],
  isMonarch: localStorage.getItem('isMonarch') === 'true'
};

function savePlayer() {
  localStorage.setItem('gender', player.gender);
  localStorage.setItem('level', player.level);
  localStorage.setItem('exp', player.exp);
  localStorage.setItem('expToNext', player.expToNext);
  localStorage.setItem('lastReset', player.lastReset);
  localStorage.setItem('lastBoss', player.lastBoss);
  localStorage.setItem('shadows', JSON.stringify(player.shadows));
  localStorage.setItem('isMonarch', player.isMonarch);
}

// DAILY QUESTS
let dailyQuests = [];
async function loadDailyQuests() {
  const fallback = [
    {name:"Push-ups", reps:100, gif:"https://i.imgur.com/lnF5T.png"},
    {name:"Air Squats", reps:120, gif:"https://i.imgur.com/4p4q3.gif"},
    {name:"Burpees", reps:50, gif:"https://i.imgur.com/burpee.gif"},
    {name:"Plank", reps:180, gif:"https://i.imgur.com/plank.gif"}
  ];
  dailyQuests = fallback.map(q => ({...q, done: false}));
  renderQuests();
}

function renderQuests() {
  const list = document.getElementById('questList');
  list.innerHTML = '';
  dailyQuests.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = `quest-item ${q.done ? 'completed' : ''}`;
    div.innerHTML = `
      <div><strong>${q.name}</strong> × ${q.reps} reps
        <img src="${q.gif}" class="exercise-gif" onerror="this.style.display='none'">
      </div>
      <input type="checkbox" class="quest-checkbox" ${q.done ? 'checked disabled' : ''}>
    `;
    div.querySelector('input').onchange = () => {
      playClick();
      q.done = true;
      div.classList.add('completed');
      if (dailyQuests.every(q => q.done)) {
        document.getElementById('completeQuest').disabled = false;
        document.getElementById('completeQuest').textContent = "CLAIM REWARD";
      }
    };
    list.appendChild(div);
  });
}

document.getElementById('completeQuest').onclick = () => {
  playClick();
  const expGain = 300 + player.level * 80;
  addExp(expGain);
  alert(`Daily Quest Completed! +${expGain} EXP`);
  document.getElementById('completeQuest').disabled = true;
  player.lastReset = new Date().toDateString();
  savePlayer();
};

// GATES SYSTEM
function spawnGates() {
  const gates = [
    {name: "E-Rank Dungeon", exp: 200, risk: "Low"},
    {name: "D-Rank Gate", exp: 500, risk: "Medium"},
    {name: "C-Rank Red Gate", exp: 1500, risk: "High", boss: "Cerberus"}
  ];
  const list = document.getElementById('gateList');
  list.innerHTML = '';
  gates.forEach(gate => {
    const div = document.createElement('div');
    div.className = 'gate-item';
    div.innerHTML = `<strong>${gate.name}</strong> — +${gate.exp} EXP (${gate.risk})`;
    div.onclick = () => {
      playGate();
      if (confirm(`Enter ${gate.name}?`)) {
        addExp(gate.exp);
        if (gate.boss && Math.random() < 0.3) {
          setTimeout(() => extractShadow(gate.boss), 1000);
        }
        alert(`Gate Cleared! +${gate.exp} EXP`);
      }
    };
    list.appendChild(div);
  });
}

function extractShadow(name) {
  playExtract();
  player.shadows.push({name, level: player.level});
  savePlayer();
  document.getElementById('extractedName').textContent = `${name} has risen as your shadow!`;
  document.getElementById('shadowExtractPopup').classList.remove('hidden');
  setTimeout(() => document.getElementById('shadowExtractPopup').classList.add('hidden'), 5000);
  renderShadows();
}

// SHADOW ARMY
function renderShadows() {
  const inv = document.getElementById('shadowInventory');
  inv.innerHTML = player.shadows.length ? '' : '<p>No shadows extracted yet...</p>';
  player.shadows.forEach(s => {
    const div = document.createElement('div');
    div.className = 'shadow-item';
    div.innerHTML = `<strong>${s.name}</strong> — Level ${s.level} Shadow Soldier`;
    inv.appendChild(div);
  });
}

// EXP & LEVEL UP
function addExp(amount) {
  player.exp += amount;
  levelUpCheck();
  updateUI();
}

function levelUpCheck() {
  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level++;
    player.expToNext = Math.floor(player.expToNext * 1.6);
    levelUpSfx.play();
    showLevelUp();

    if (player.level === 50 && !player.isMonarch) {
      awakenMonarch();
    }
  }
  savePlayer();
}

function awakenMonarch() {
  player.isMonarch = true;
  savePlayer();
  ashbornVoice.play();
  document.body.classList.add('monarch-mode');
  document.getElementById('ashbornAwaken').classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('ashbornAwaken').classList.add('hidden');
  }, 9000);
}

function showLevelUp() {
  const p = document.getElementById('levelUpPopup');
  p.classList.remove('hidden');
  setTimeout(() => p.classList.add('hidden'), 3000);
}

// BOSS RAID
document.getElementById('fightBoss').onclick = () => {
  playClick();
  if (confirm("Face the Ant King Beru?")) {
    const bonus = (500 + player.level * 100) * 10;
    addExp(bonus);
    player.lastBoss = new Date().toDateString();
    savePlayer();
    extractShadow("Beru");
    alert(`BERU DEFEATED! +${bonus} EXP\nShadow Extracted!`);
    document.getElementById('bossRaidBanner').classList.add('hidden');
  }
};

function checkBossRaid() {
  const day = new Date().getDay();
  if (day === 0 && player.lastBoss !== new Date().toDateString()) {
    document.getElementById('bossRaidBanner').classList.remove('hidden');
  }
}

// TIMER
function startTimer() {
  setInterval(() => {
    const tomorrow = new Date();
    tomorrow.setHours(24,0,0,0);
    const diff = tomorrow - new Date();
    const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    document.getElementById('timer').textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function updateUI() {
  document.getElementById('playerLevel').textContent = player.level;
  document.getElementById('playerExp').textContent = player.exp;
  document.getElementById('expToNext').textContent = player.expToNext;
  document.getElementById('playerRank').textContent = player.level >= 50 ? "SHADOW MONARCH" :
    player.level >= 40 ? "National Level" : player.level >= 30 ? "S-Rank" : "E-Rank";
  document.getElementById('expFill').style.width = (player.exp / player.expToNext * 100) + '%';
  document.getElementById('armyCount').textContent = player.isMonarch ? player.level * 15 + player.shadows.length * 10 : 0;
  renderShadows();
}

// PARTICLES
function createParticles() {
  const p = document.getElementById('particles');
  setInterval(() => {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = particle.style.height = Math.random() * 5 + 'px';
    particle.style.background = Math.random() > 0.5 ? '#9d4edd' : '#ff006e';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '-10px';
    particle.style.opacity = '0.7';
    particle.style.animation = 'fall 10s linear forwards';
    p.appendChild(particle);
    setTimeout(() => particle.remove(), 10000);
  }, 300);
}
const style = document.createElement('style');
style.textContent = `@keyframes fall { to { transform: translateY(100vh); opacity: 0; } }`;
document.head.appendChild(style);

// INIT
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
      if (player.isMonarch) document.body.classList.add('monarch-mode');
      loadDailyQuests();
      spawnGates();
      updateUI();
      startTimer();
      checkBossRaid();
      createParticles();
      bgm.play();
    };
  });
} else {
  document.getElementById('mainScreen').classList.add('active');
  document.getElementById('playerAvatar').src = `sources/${player.gender}-avatar.png`;
  if (player.isMonarch) document.body.classList.add('monarch-mode');
  loadDailyQuests();
  spawnGates();
  updateUI();
  startTimer();
  checkBossRaid();
  createParticles();
  bgm.play();
}

// AUTO PLAY FIX
document.body.addEventListener("click", () => bgm.play(), { once: true });