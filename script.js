// --- 1. INITIAL PLAYER DATA ---
let player = {
    level: 1,
    xp: 0,
    xpToLevelUp: 100,
    statPoints: 0, 
    str: 10,
    sta: 10,
    per: 10,
    // Track last completion date for reset logic
    lastCompletionDate: null 
};

// --- 2. FITNESS PROTOCOL QUESTS (Low-Core and High-Core) ---

// Define the two difficulty levels for the quests
const QUEST_PROTOCOLS = {
    // Beginner / Low-Core Protocol
    LOW_CORE: [
        { name: "Push-ups (Low)", target: 50, isCompleted: false },
        { name: "Squats (Low)", target: 50, isCompleted: false },
        { name: "Plank Hold", target: "5 Minutes", isCompleted: false },
        { name: "Cardio", target: "10 Minutes", isCompleted: false }
    ],
    // Advanced / High-Core Protocol (Unlocked based on Level/Stats)
    HIGH_CORE: [
        { name: "Push-ups (High)", target: 100, isCompleted: false },
        { name: "Sit-ups (High)", target: 100, isCompleted: false },
        { name: "Squats (High)", target: 100, isCompleted: false },
        { name: "Run", target: "1 Mile", isCompleted: false }
    ]
};

// Start with the Low-Core protocol
let dailyQuest = JSON.parse(JSON.stringify(QUEST_PROTOCOLS.LOW_CORE)); // Deep copy

// --- 3. CORE LOGIC FUNCTIONS ---

function renderStatus() {
    // ... (Code for updating stats remains the same) ...
    document.getElementById('player-level').textContent = player.level;
    document.getElementById('player-xp-current').textContent = player.xp;
    document.getElementById('player-xp-max').textContent = player.xpToLevelUp;
    document.getElementById('stat-points-display').textContent = player.statPoints;
    document.getElementById('stat-str').textContent = player.str;
    document.getElementById('stat-sta').textContent = player.sta;
    document.getElementById('stat-per').textContent = player.per;
    document.getElementById('stat-hp').textContent = player.sta * 10; 

    document.querySelectorAll('.allocate-btn').forEach(btn => {
        btn.disabled = player.statPoints === 0;
    });
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    list.innerHTML = ''; 

    dailyQuest.forEach(quest => {
        const status = quest.isCompleted ? '✅ COMPLETED' : '❌ PENDING';
        // Display the name AND the target next to it
        const targetText = typeof quest.target === 'number' ? `${quest.target} Reps` : quest.target;
        
        const listItem = document.createElement('li');
        listItem.textContent = `${status} - ${quest.name} (${targetText})`;
        list.appendChild(listItem);
    });
}

function levelUp() {
    player.level += 1;
    player.xp = 0;
    player.xpToLevelUp += 50; 
    player.statPoints += 3; 
    document.getElementById('message').textContent = `[DING!] Level Up! You are now Level ${player.level}! You gained 3 Stat Points!`;
}


function handleQuestCompletion() {
    const messageDisplay = document.getElementById('message');
    
    if (dailyQuest.every(q => q.isCompleted)) {
        // Quest already completed today
        messageDisplay.textContent = `[SYSTEM MESSAGE] Daily Quest already finished today. Try again tomorrow.`;
        return;
    }
    
    // Check for "Penalty" scenario (failed to complete by end of day - simulated here as a reset)
    // NOTE: This is complex in HTML/JS. For MVP, we assume a manual check for now.
    
    // Complete the Quest
    dailyQuest.forEach(q => q.isCompleted = true);
    
    // Reward: Gain XP
    const xpGained = 50;
    player.xp += xpGained;
    messageDisplay.textContent = `[QUEST SUCCESS] Daily Quest completed! +${xpGained} XP awarded.`;

    // Set the last completion date (simulating a "day end")
    player.lastCompletionDate = new Date().toDateString(); 

    // Check for Level Up
    if (player.xp >= player.xpToLevelUp) {
        levelUp();
    }
    
    renderQuests();
    renderStatus();
}

// NEW: Function to simulate daily reset/penalty check
function checkDailyReset() {
    const today = new Date().toDateString();
    
    if (player.lastCompletionDate && player.lastCompletionDate !== today) {
        // A new day has started since the last check
        if (!dailyQuest.every(q => q.isCompleted)) {
            // PENALTY LOGIC
            player.sta = Math.max(1, player.sta - 1); // Lose 1 STA point, but never go below 1
            document.getElementById('message').textContent = `[PENALTY] Failure to complete Daily Quest. Stamina -1.`;
        }
        
        // Reset the quest for the new day
        dailyQuest = JSON.parse(JSON.stringify(
            player.level >= 10 ? QUEST_PROTOCOLS.HIGH_CORE : QUEST_PROTOCOLS.LOW_CORE
        ));
        
        player.lastCompletionDate = today; 
        renderQuests();
        renderStatus();
    }
}


// --- 4. VOICE COMMAND LOGIC ---
const voiceStatus = document.getElementById('voice-status');

function startSpeechRecognition() {
    // ... (Voice recognition code remains the same) ...
    if (!('webkitSpeechRecognition' in window)) {
        voiceStatus.textContent = '[SYSTEM ERROR] Voice commands are not supported by your browser.';
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
    if (command.includes("complete quest") || command.includes("finish quest") || command.includes("quest complete")) {
        document.getElementById('message').textContent = `[SYSTEM CONFIRMATION] Executing: Quest Complete...`;
        handleQuestCompletion();
    } else if (command.includes("allocate strength")) {
        handleStatAllocation({ target: { dataset: { stat: 'str' } } });
    } else {
        document.getElementById('message').textContent = `[SYSTEM] Command not recognized: "${command}"`;
    }
}


// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Check for penalty/reset when the page loads
    checkDailyReset(); 

    // Attach button handlers
    document.getElementById('complete-quest-btn').addEventListener('click', handleQuestCompletion);
    document.getElementById('voice-command-btn').addEventListener('click', startSpeechRecognition);
    document.querySelectorAll('.allocate-btn').forEach(button => {
        button.addEventListener('click', handleStatAllocation);
    });

    // Render the initial state
    renderStatus();
    renderQuests();

    document.getElementById('message').textContent = 'System Ready. Complete your Daily Quest.';
});
