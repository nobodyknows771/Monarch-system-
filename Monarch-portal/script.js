// --- 1. INITIAL PLAYER DATA ---
let player = {
    level: 1,
    xp: 0,
    xpToLevelUp: 100,
    statPoints: 0, // NEW: Points to spend
    str: 10,
    sta: 10,
    per: 10
};

// --- 2. THE DAILY QUEST ---
const dailyQuest = [
    { name: "Push-ups", target: 100, isCompleted: false },
    { name: "Sit-ups", target: 100, isCompleted: false },
    { name: "Squats", target: 100, isCompleted: false },
    { name: "Run (1 Mile)", target: 1, isCompleted: false }
];

// --- 3. DOM UPDATING FUNCTIONS ---
function renderStatus() {
    // Update basic stats
    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-xp-current').textContent = player.xp;
    document.getElementById('player-xp-max').textContent = player.xpToLevelUp;
    
    // NEW: Update Stat Points
    document.getElementById('stat-points-display').textContent = player.statPoints;
    
    // Update Core Stats
    document.getElementById('stat-str').textContent = player.str;
    document.getElementById('stat-sta').textContent = player.sta;
    document.getElementById('stat-per').textContent = player.per;
    
    // Simple HP calculation based on STA
    document.getElementById('stat-hp').textContent = player.sta * 10; 

    // Enable/Disable Allocation Buttons based on available points
    document.querySelectorAll('.allocate-btn').forEach(btn => {
        btn.disabled = player.statPoints === 0;
    });
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = ''; 

    dailyQuest.forEach(quest => {
        const listItem = document.createElement('li');
        const status = quest.isCompleted ? '✅ COMPLETED' : '❌ PENDING';
        listItem.textContent = `${status} - ${quest.name} (${quest.target})`;
        list.appendChild(listItem);
    });
}

// --- 4. GAME LOGIC ---

function levelUp() {
    player.level += 1;
    player.xp = 0;
    player.xpToLevelUp += 50; 
    player.statPoints += 3; // Grant 3 points upon level up (NEW)
    document.getElementById('message').textContent = `[DING!] Level Up! You are now Level ${player.level}! You gained 3 Stat Points!`;
}

function handleQuestCompletion() {
    // For simplicity, we assume they complete all quests at once
    dailyQuest.forEach(q => q.isCompleted = true);
    renderQuests(); 
        
    // Reward: Gain XP
    player.xp += 50;
    document.getElementById('message').textContent = `[SYSTEM MESSAGE] Daily Quest completed! +50 XP awarded.`;

    // Check for Level Up
    if (player.xp >= player.xpToLevelUp) {
        levelUp();
    }
    
    renderStatus();
}

function handleStatAllocation(event) {
    const stat = event.target.dataset.stat;
    
    if (player.statPoints > 0) {
        player[stat] += 1;
        player.statPoints -= 1;
        document.getElementById('message').textContent = `[SYSTEM] Allocated 1 point to ${stat.toUpperCase()}.`;
    } else {
        document.getElementById('message').textContent = `[SYSTEM WARNING] Insufficient Stat Points. Complete Quests!`;
    }
    renderStatus();
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach the completion function
    document.getElementById('complete-quest-btn').addEventListener('click', handleQuestCompletion);
    
    // Attach the allocation function to all '+' buttons
    document.querySelectorAll('.allocate-btn').forEach(button => {
        button.addEventListener('click', handleStatAllocation);
    });

    // Render the initial state
    renderStatus();
    renderQuests();

    document.getElementById('message').textContent = 'System Ready. Complete your Daily Quest.';
});
