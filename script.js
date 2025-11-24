// --- 1. INITIAL PLAYER DATA & LOCAL STORAGE PERSISTENCE ---

// Load data from Local Storage or use defaults
let player = JSON.parse(localStorage.getItem('soloMonarchPlayer')) || {
    level: 1,
    xp: 0,
    xpToLevelUp: 100,
    statPoints: 0, 
    str: 10,
    sta: 10,
    per: 10,
    // Store completion status and protocol level
    currentProtocol: 'LOW_CORE', 
    questStatus: [
        { name: "Push-ups (Low)", target: 50, isCompleted: false },
        { name: "Squats (Low)", target: 50, isCompleted: false },
        { name: "Plank Hold", target: "5 Minutes", isCompleted: false },
        { name: "Cardio", target: "10 Minutes", isCompleted: false }
    ],
    lastActivityDate: new Date().toDateString() 
};

// Reassign questStatus to dailyQuest for easier use
let dailyQuest = player.questStatus;

// Function to save the current player state
function savePlayerState() {
    player.questStatus = dailyQuest;
    localStorage.setItem('soloMonarchPlayer', JSON.stringify(player));
}

// --- 2. FITNESS PROTOCOL QUESTS (High-Core logic) ---
const QUEST_PROTOCOLS = {
    LOW_CORE: [
        { name: "Push-ups (Low)", target: 50, isCompleted: false },
        { name: "Squats (Low)", target: 50, isCompleted: false },
        { name: "Plank Hold", target: "5 Minutes", isCompleted: false },
        { name: "Cardio", target: "10 Minutes", isCompleted: false }
    ],
    HIGH_CORE: [
        { name: "Push-ups (High)", target: 100, isCompleted: false },
        { name: "Sit-ups (High)", target: 100, isCompleted: false },
        { name: "Squats (High)", target: 100, isCompleted: false },
        { name: "Run", target: "1 Mile", isCompleted: false }
    ]
};

// --- 3. CORE RENDERING AND UI UPDATES ---

function renderStatus() {
    // Renders all current player data to the HTML
    const xpPercentage = (player.xp / player.xpToLevelUp) * 100;

    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-xp-current').textContent = player.xp;
    document.getElementById('player-xp-max').textContent = player.xpToLevelUp;
    document.getElementById('stat-points-display').textContent = player.statPoints;
    
    document.getElementById('stat-str').textContent = player.str;
    document.getElementById('stat-sta').textContent = player.sta;
    document.getElementById('stat-per').textContent = player.per;
    document.getElementById('stat-hp').textContent = player.sta * 10; 
    document.getElementById('protocol-level').textContent = player.currentProtocol;
    
    // Update XP Bar
    document.getElementById('xp-progress-bar').style.width = `${xpPercentage}%`;

    // Enable/Disable Allocation Buttons
    document.querySelectorAll('.allocate-btn').forEach(btn => {
        btn.disabled = player.statPoints === 0;
    });
    
    savePlayerState();
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = ''; 

    dailyQuest.forEach(quest => {
        const status = quest.isCompleted ? '✅' : '❌';
        const targetText = typeof quest.target === 'number' ? `${quest.target} Reps` : quest.target;
        
        const listItem = document.createElement('li');
        listItem.textContent = `${status} ${quest.name}: ${targetText}`;
        list.appendChild(listItem);
    });
}

// --- 4. GAME MECHANICS (LEVEL UP, QUEST, PENALTY) ---

function levelUp() {
    player.level += 1;
    player.xp = 0;
    player.xpToLevelUp += 50; 
    player.statPoints += 3; // Grant 3 points upon level up
    
    // Check if Protocol is unlocked
    if (player.level >= 10 && player.currentProtocol === 'LOW_CORE') {
        player.currentProtocol = 'HIGH_CORE';
        document.getElementById('message').textContent = `[DING! LEVEL UP & PROTOCOL UPGRADE] Level ${player.level}! High-Core Fitness Protocol Unlocked!`;
        // The quest will be reset to HIGH_CORE on the next day's check.
    } else {
        document.getElementById('message').textContent = `[DING! LEVEL UP] You are now Level ${player.level}! You gained 3 Stat Points!`;
    }
}


function assignNewQuest(protocol) {
    // Reset the quest using a deep copy of the assigned protocol
    dailyQuest = JSON.parse(JSON.stringify(QUEST_PROTOCOLS[protocol]));
    player.currentProtocol = protocol;
    player.lastActivityDate = new Date().toDateString(); // Update the last active date
    
    renderQuests();
    renderStatus();
}

function checkDailyReset() {
    const today = new Date().toDateString();
    
    if (player.lastActivityDate !== today) {
        // A new day has started since the last activity/save
        
        // 1. PENALTY CHECK
        if (!dailyQuest.every(q => q.isCompleted)) {
            // Quest was NOT completed yesterday
            player.sta = Math.max(1, player.sta - 3); // Penalty: Lose 3 STA points
            document.getElementById('message').textContent = `[CRITICAL PENALTY] Quest Failed Yesterday. Stamina -3. Begin New Quest.`;
        } else {
            document.getElementById('message').textContent = `[SYSTEM LOG] Yesterday's Quest Cleared. New Quest Assigned.`;
        }
        
        // 2. ASSIGN NEW QUEST (Based on current protocol)
        const protocol = player.level >= 10 ? 'HIGH_CORE' : 'LOW_CORE';
        assignNewQuest(protocol);
        
    } else {
        document.getElementById('message').textContent = 'System Ready. Complete your Daily Quest.';
    }
}


function handleQuestCompletion() {
    const messageDisplay = document.getElementById('message');
    
    if (dailyQuest.every(q => q.isCompleted)) {
        messageDisplay.textContent = `[SYSTEM MESSAGE] Quest already finished today. Try again tomorrow.`;
        return;
    }
    
    // Complete the Quest
    dailyQuest.forEach(q => q.isCompleted = true);
    
    // Reward: Gain XP (HIGH_CORE gives more XP)
    const xpGained = player.currentProtocol === 'HIGH_CORE' ? 80 : 50;
    player.xp += xpGained;
    messageDisplay.textContent = `[QUEST SUCCESS] Daily Quest completed! +${xpGained} XP awarded.`;

    // Check for Level Up
    if (player.xp >= player.xpToLevelUp) {
        levelUp();
    }
    
    renderQuests();
    renderStatus();
}

function handleStatAllocation(event) {
    const stat = event.target.dataset.stat;
    const messageDisplay = document.getElementById('message');

    if (player.statPoints > 0) {
        player[stat] += 1;
        player.statPoints -= 1;
        messageDisplay.textContent = `[SYSTEM] Allocated 1 point to ${stat.toUpperCase()}. Current ${stat.toUpperCase()}: ${player[stat]}.`;
    } else {
        messageDisplay.textContent = `[SYSTEM WARNING] Insufficient Stat Points. Complete Quests!`;
    }
    renderStatus();
}

// --- 5. VOICE COMMAND LOGIC ---
const voiceStatus = document.getElementById('voice-status');

function startSpeechRecognition() {
    // Checks for compatibility (Chrome/Edge required for webkitSpeechRecognition)
    if (!('webkitSpeechRecognition' in window)) {
        voiceStatus.textContent = '[SYSTEM ERROR] Voice commands are not supported by your browser (Use Chrome/Edge).';
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        voiceStatus.textContent = 'System Listening... Speak command now.';
        document.getElementById('voice-command-btn').disabled = true;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        voiceStatus.textContent = `System heard: "${transcript}"`;
        handleVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        voiceStatus.textContent = `System Error: ${event.error}. Try saying "System [Command]".`;
        document.getElementById('voice-command-btn').disabled = false;
    };
    
    recognition.onend = () => {
        document.getElementById('voice-command-btn').disabled = false;
        if (!voiceStatus.textContent.includes("System heard")) {
             voiceStatus.textContent = 'System Listening Ended.';
        }
    };

    recognition.start();
}

function handleVoiceCommand(command) {
    const messageDisplay = document.getElementById('message');
    command = command.replace('system', '').trim(); // Remove "System" trigger word

    if (command.includes("complete quest") || command.includes("finish quest")) {
        messageDisplay.textContent = `[SYSTEM CONFIRMATION] Executing: Quest Complete...`;
        handleQuestCompletion();
    } else if (command.includes("allocate strength") || command.includes("add strength")) {
        handleStatAllocation({ target: { dataset: { stat: 'str' } } });
    } else if (command.includes("allocate stamina") || command.includes("add stamina")) {
        handleStatAllocation({ target: { dataset: { stat: 'sta' } } });
    } else if (command.includes("status")) {
        messageDisplay.textContent = `[SYSTEM REPORT] Current Level is ${player.level}. Available Stat Points: ${player.statPoints}.`;
    } else {
        messageDisplay.textContent = `[SYSTEM] Command not recognized: "${command}". Try "complete quest".`;
    }
}


// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for penalty/reset when the page loads
    checkDailyReset(); 

    // 2. Attach button handlers
    document.getElementById('complete-quest-btn').addEventListener('click', handleQuestCompletion);
    document.getElementById('voice-command-btn').addEventListener('click', startSpeechRecognition);
    
    document.querySelectorAll('.allocate-btn').forEach(button => {
        button.addEventListener('click', handleStatAllocation);
    });

    // 3. Render the initial state
    renderStatus();
    renderQuests();
    
    // Save current status every 5 seconds (Persistence)
    setInterval(savePlayerState, 5000); 
});
