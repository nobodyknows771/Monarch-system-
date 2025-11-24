// AUDIO CONTROLS
const bgm = document.getElementById('bgm');
const clickSfx = document.getElementById('clickSfx');
const levelUpSfx = document.getElementById('levelUpSfx');
const ashbornVoice = document.getElementById('ashbornVoice');
const gateOpen = document.getElementById('gateOpen');
const shadowExtract = document.getElementById('shadowExtract');

let bgmOn = true, sfxOn = true;

document.getElementById('muteBgm').onclick = () => {
  bgmOn = !bgmOn;
  if (bgmOn) bgm.play(); else bgm.pause();
  document.getElementById('muteBgm').textContent = `BGM: ${bgmOn ? 'ON' : 'OFF'}`;
  playClick();
};

document.getElementById('muteSfx').onclick = () => {
  sfxOn = !sfxOn;
  document.getElementById('muteSfx').textContent = `SFX: ${sfxOn ? 'ON' : 'OFF'}`;
  playClick();
};

document.getElementById('resetData').onclick = () => {
  if (confirm('Reset all System data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
  playClick();
};

function playClick() { if (sfxOn) { clickSfx.currentTime = 0; clickSfx.play().catch(() => {}); } }
function playGate() { if (sfxOn) gateOpen.play().catch(() => {}); }
function playExtract() { if (sfxOn) shadowExtract.play().catch(() => {}); }

// PLAYER DATA SYSTEM
let player = {
  gender: localStorage.getItem('gender') || null,
  name: localStorage.getItem('name') || 'Sung Jinwoo',
  level: parseInt(localStorage.getItem('level')) || 1,
  exp: parseInt(localStorage.getItem('exp')) || 0,
  expToNext: parseInt(localStorage.getItem('expToNext')) || 100,
  lastReset: localStorage.getItem('lastReset') || null,
  lastBoss: localStorage.getItem('lastBoss') || null,
  shadows: JSON.parse(localStorage.getItem('shadows')) || [],
  completedToday: localStorage.getItem('completedToday') === 'true',
  isMonarch: localStorage.getItem('isMonarch') === 'true'
};

function savePlayer() {
  Object.keys(player).forEach(key => localStorage.setItem(key, typeof player[key] === 'object' ? JSON.stringify(player[key]) : player[key]));
}

// DAILY QUEST GENERATOR
let dailyQuests = [];
async function loadDailyQuests() {
  const today = new Date().toDateString();
  if (player.lastReset !== today) {
    player.completedToday = false;
    player.lastReset = today;
    savePlayer();
  }
  if (player.completedToday) {
    document.getElementById('completeQuest').classList.add('disabled');
    document.getElementById('completeQuest').textContent = 'QUEST CLEARED';
    document.getElementById('completeQuest').disabled = true;
  }

  // Fallback quests (Solo Leveling style: bodyweight only)
  dailyQuests = [
    { name: 'Push-ups', reps: 60, gif: 'https://example.com/pushup.gif', done: false },
    { name: 'Sit-ups', reps: 60, gif: 'https://example.com/situp.gif', done: false },
    { name: 'Squats', reps: 60, gif: 'https://example.com/squat.gif', done: false },
    { name: 'Burpees', reps: 30, gif: 'https://example.com/burpee.gif', done: false }
  ].map(q => ({ ...q, done: false })); // Reset if new day
  renderQuests();
}

function renderQuests() {
  const container = document.getElementById('questList');
  container.innerHTML = '';
  dailyQuests.forEach((quest, index) => {
    const item = document.createElement('div');
    item.className = `quest-item ${quest.done ? 'completed' : ''}`;
    item.innerHTML = `
      <div>
        <strong>${quest.name.toUpperCase()}</strong> [${quest.done ? quest.reps : '0'}/${quest.reps}]
        ${quest.gif ? `<img src="${quest.gif}" alt="${quest.name}" class="exercise-gif" onerror="this.remove()">` : ''}
      </div>
      <input type="checkbox" class="quest-checkbox" ${quest.done ? 'checked disabled' : ''}>
    `;
    item.querySelector('.quest-checkbox').onchange = (e) => {
      playClick();
      quest.done = e.target.checked;
      item.classList.toggle('completed', quest.done);
      const allDone = dailyQuests.every(q => q.done);
      const claimBtn = document.getElementById('completeQuest');
      if (allDone && !player.completedToday) {
        claimBtn.classList.remove('disabled');
        claimBtn.disabled = false;
        claimBtn.textContent = 'COMPLETE & CLAIM';
      }
      savePlayer();
    };
    container.appendChild(item);
  });
}

document.getElementById('completeQuest').onclick = () => {
  if (player.completedToday || !dailyQuests.every(q => q.done)) return;
  playClick();
  const reward = 200 + player.level * 30;
  addExp(reward);
  player.completedToday = true;
  savePlayer();
  document.getElementById('completeQuest').textContent = 'REWARDS CLAIMED';
  document.getElementById('completeQuest').disabled = true;
  document.getElementById('completeQuest').classList.add('disabled');
  alert(`[SYSTEM] Daily Quest Cleared! +${reward} EXP Gained.`);
};

// GATE SYSTEM
function spawnGates() {
  const gates = [
    { name: 'E-RANK DUNGEON', exp: 150, risk: 'Low Risk' },
    { name: 'D-RANK GATE', exp: 400, risk: 'Medium Risk' },
    { name: 'C-RANK RED GATE', exp: 1200, risk: 'High Risk - Boss Possible' }
  ];
  const list = document.getElementById('gateList');
  list.innerHTML = '';
  gates.forEach(gate => {
    const item = document.createElement('div');
    item.className = 'gate-item';
    item.innerHTML = `<strong>${gate.name}</strong><br>${gate.risk} | +${gate.exp} EXP`;
    item.onclick = () => {
      playGate();
      if (confirm(`[SYSTEM] Enter ${gate.name}?`)) {
        addExp(gate.exp);
        if (gate.risk.includes('Boss') && Math.random() < 0.4) {
          setTimeout(() => extractShadow('Cerberus'), 1500);
        }
        alert(`[SYSTEM] Gate Cleared! +${gate.exp} EXP.`);
      }
    };
    list.appendChild(item);
  });
}

function extractShadow(entityName) {
  playExtract();
  player.shadows.push({ name: entityName, level: player.level });
  savePlayer();
  document.getElementById('extractedName').textContent = `${entityName.toUpperCase()} EXTRACTED AS SHADOW.`;
  document.getElementById('shadowExtractPopup').classList.remove('hidden');
  setTimeout(() => document.getElementById('shadowExtractPopup').classList.add('hidden'), 4000);
  renderShadows();
}

function renderShadows() {
  const container = document.getElementById('shadowInventory');
  if (!player.shadows.length) return container.innerHTML = '<p class="empty-state">No shadows extracted.</p>';
  container.innerHTML = player.shadows.map(shadow => 
    `<div class="shadow-item"><strong>${shadow.name.toUpperCase()}</strong> - LV. ${shadow.level}</div>`
  ).join('');
}

// EXP & LEVELING SYSTEM
function addExp(amount) {
  player.exp += amount;
  updateUI();
  levelUpCheck();
}

function levelUpCheck() {
  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level++;
    player.expToNext = Math.floor(player.expToNext * 1.4 + 50);
    if (sfxOn) levelUpSfx.play();
    showNotification('levelUpPopup', `LEVEL UP! LV. ${player.level}`);
    
    if (player.level === 50 && !player.isMonarch) {
      awakenMonarch();
    }
  }
  savePlayer();
}

function awakenMonarch() {
  player.isMonarch = true;
  savePlayer();
  if (sfxOn) ashbornVoice.play();
  document.body.classList.add('monarch-mode');
  showNotification('ashbornAwaken', 'Shadow Monarch Awakened.');
}

function showNotification(id, message = '') {
  const popup = document.getElementById(id);
  if (message) popup.querySelector('p').textContent = message;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 3000);
}

// BOSS RAID
document.getElementById('fightBoss').onclick = () => {
  playClick();
  if (confirm('[SYSTEM] Enter Red Gate? Ant King awaits.')) {
    const reward = (300 + player.level * 50) * 10;
    addExp(reward);
    player.lastBoss = new Date().toDateString();
    savePlayer();
    extractShadow('Beru');
    document.getElementById('bossRaidBanner').classList.add('hidden');
    alert(`[SYSTEM] Ant King Defeated! +${reward} EXP. Shadow Extracted.`);
  }
};

function checkBossRaid() {
  const day = new Date().getDay(); // Sunday = 0
  const today = new Date().toDateString();
  if (day === 0 && player.lastBoss !== today) {
    document.getElementById('bossRaidBanner').classList.remove('hidden');
  } else {
    document.getElementById('bossRaidBanner').classList.add('hidden');
  }
}

// UI UPDATER
function updateUI() {
  document.getElementById('playerLevel').textContent = player.level;
  document.getElementById('playerExp').textContent = player.exp;
  document.getElementById('expToNext').textContent = player.expToNext;
  const rank = player.level >= 50 ? 'S' : player.level >= 30 ? 'A' : player.level >= 20 ? 'B' : 'E';
  document.getElementById('playerRank').textContent = rank;
  document.getElementById('expFill').style.width = `${(player.exp / player.expToNext) * 100}%`;
  document.getElementById('armyCount').textContent = player.isMonarch ? (player.level * 5 + player.shadows.length * 8) : 0;
  renderShadows();
  loadDailyQuests();
  spawnGates();
}

// COUNTDOWN TIMER
function startTimer() {
  setInterval(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  if (!player.gender) {
    // Gender select active by default
    document.querySelectorAll('.gender-card').forEach(card => {
      card.onclick = () => {
        playClick();
        player.gender = card.dataset.gender;
        player.name = player.gender === 'male' ? 'Sung Jinwoo' : 'Cha Hae-In';
        document.getElementById('playerAvatar').src = `sources/${player.gender}-avatar.png`;
        document.getElementById('playerName').textContent = player.name;
        savePlayer();
        
        // CRITICAL FIX: Remove hidden before adding active
        const mainScreen = document.getElementById('mainScreen');
        mainScreen.classList.remove('hidden');
        mainScreen.classList.add('active');
        
        document.getElementById('genderSelect').classList.remove('active');
        document.getElementById('genderSelect').classList.add('hidden');
        
        if (player.isMonarch) document.body.classList.add('monarch-mode');
        updateUI();
        startTimer();
        checkBossRaid();
        if (bgmOn) bgm.play().catch(() => {});
        
        // Auto-play unlock
        document.removeEventListener('click', autoPlayOnce);
      };
    });
  } else {
    // Load existing
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('mainScreen').classList.add('active');
    document.getElementById('genderSelect').classList.add('hidden');
    document.getElementById('playerAvatar').src = `sources/${player.gender}-avatar.png`;
    document.getElementById('playerName').textContent = player.name;
    if (player.isMonarch) document.body.classList.add('monarch-mode');
    updateUI();
    startTimer();
    checkBossRaid();
    if (bgmOn) bgm.play().catch(() => {});
  }
  
  // One-time auto-play unlock
  function autoPlayOnce() {
    if (bgmOn) bgm.play().catch(() => {});
    document.removeEventListener('click', autoPlayOnce);
  }
  document.addEventListener('click', autoPlayOnce);
});

// END OF SCRIPT - 752 LINES