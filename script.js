// --- 1. INITIAL PLAYER DATA ---
let player = {
    level: 1,
    xp: 0,
    xpToLevelUp: 100,
    statPoints: 0, 
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
    player.statPoints += 3; // Grant 3 points upon level up
    document.getElementById('message').textContent = `[DING!] Level Up! You are now Level ${player.level}! You gained 3 Stat Points!`;
}

function handleQuestCompletion() {
    const messageDisplay = document.getElementById('message');
    
    // Check if quest is already complete (for simple MVP logic)
    if (dailyQuest.every(q => q.isCompleted)) {
        // Penalty or reset
        dailyQuest.forEach(q => q.isCompleted = false);
        messageDisplay.textContent = `[SYSTEM MESSAGE] Quest reset for tomorrow. Stay diligent!`;
    } else {
        // Completion
        dailyQuest.forEach(q => q.isCompleted = true);
        
        // Reward: Gain XP
        const xpGained = 50;
        player.xp += xpGained;
        messageDisplay.textContent = `[SYSTEM MESSAGE] Daily Quest completed! +${xpGained} XP awarded.`;

        // Check for Level Up
        if (player.xp >= player.xpToLevelUp) {
            levelUp();
        }
    }
    
    renderQuests();
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

// --- 5. VOICE COMMAND LOGIC ---
const voiceStatus = document.getElementById('voice-status');

function startSpeechRecognition() {
    // Check for browser compatibility
    if (!('webkitSpeechRecognition' in window)) {
        voiceStatus.textContent = '[SYSTEM ERROR] Voice commands are not supported by your browser (Requires Chrome/Edge).';
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Listen for one command
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
        voiceStatus.textContent = `System Error: ${event.error}`;
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
    // Basic command matching
    if (command.includes("complete quest") || command.includes("finish quest") || command.includes("quest complete")) {
        document.getElementById('message').textContent = `[SYSTEM CONFIRMATION] Executing: Quest Complete...`;
        handleQuestCompletion();
    } else if (command.includes("allocate strength")) {
        // Simple way to trigger stat allocation via voice command
        document.getElementById('message').textContent = `[SYSTEM CONFIRMATION] Allocating point to STR...`;
        handleStatAllocation({ target: { dataset: { stat: 'str' } } });
    } else {
        document.getElementById('message').textContent = `[SYSTEM] Command not recognized: "${command}"`;
    }
}


// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach the completion function
    document.getElementById('complete-quest-btn').addEventListener('click', handleQuestCompletion);
    
    // Attach the allocation function to all '+' buttons
    document.querySelectorAll('.allocate-btn').forEach(button => {
        button.addEventListener('click', handleStatAllocation);
    });

    // Attach the Voice Command function
    document.getElementById('voice-command-btn').addEventListener('click', startSpeechRecognition);

    // Render the initial state
    renderStatus();
    renderQuests();

    document.getElementById('message').textContent = 'System Ready. Complete your Daily Quest.';
});
