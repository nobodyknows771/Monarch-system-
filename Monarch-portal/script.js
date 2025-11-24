// --- 1. INITIAL SYSTEM STATE ---
let player = {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gold: 0,
    statPoints: 0,
    stats: {
        str: 10,
        agi: 10,
        sta: 10,
    }
};

// --- 2. CORE UI UPDATE FUNCTIONS ---

function updateUI() {
    // Update basic stats
    document.getElementById('level').textContent = player.level;
    document.getElementById('gold').textContent = player.gold;
    document.getElementById('stat-points').textContent = player.statPoints;

    // Update core attributes
    document.getElementById('str').textContent = player.stats.str;
    document.getElementById('agi').textContent = player.stats.agi;
    document.getElementById('sta').textContent = player.stats.sta;

    // Update XP Bar
    let xpPercentage = (player.xp / player.xpToNextLevel) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercentage}%`;

    // Disable stat buttons if no points
    const statButtons = document.querySelectorAll('.stat-btn');
    statButtons.forEach(btn => {
        btn.disabled = player.statPoints === 0;
    });
}

function systemMessage(message) {
    const output = document.getElementById('system-output');
    output.textContent = `System Status: ${message}`;
}

// --- 3. GAME LOGIC (XP & LEVELING) ---

function checkLevelUp() {
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel; // Subtract XP needed
        player.level += 1; // Increase Level
        player.xpToNextLevel = Math.round(player.xpToNextLevel * 1.5); // Increase requirement
        player.statPoints += 3; // Grant Stat Points
        systemMessage(`LEVEL UP! Current Level: ${player.level}. 3 Stat Points Acquired.`);
    }
    updateUI();
}

function allocateStat(statKey) {
    if (player.statPoints > 0) {
        player.stats[statKey] += 1;
        player.statPoints -= 1;
        systemMessage(`${statKey.toUpperCase()} increased! Current ${statKey.toUpperCase()}: ${player.stats[statKey]}`);
        updateUI();
    } else {
        systemMessage("Insufficient Stat Points. Complete Quests to Level Up.");
    }
}

// --- 4. QUEST & WORKOUT FUNCTIONS ---

function completeDailyQuest() {
    const xpReward = 25;
    const goldReward = 5;
    player.xp += xpReward;
    player.gold += goldReward;
    systemMessage(`Daily Quest successful! +${xpReward} XP, +${goldReward} Gold.`);
    checkLevelUp();
}

function logWorkout() {
    const description = document.getElementById('workout-description').value;
    if (description.trim() === "") {
        systemMessage("Error: Input a workout description first.");
        return;
    }
    
    // Simulate a bigger XP/Gold reward for an 'Invasion'
    const xpReward = 50;
    const goldReward = 15;
    player.xp += xpReward;
    player.gold += goldReward;
    
    systemMessage(`Dungeon Invasion Logged (${description}): +${xpReward} XP, +${goldReward} Gold.`);
    document.getElementById('workout-description').value = ''; // Clear input
    checkLevelUp();
}

// --- 5. VOICE COMMANDS (Web Speech API) ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesis = window.speechSynthesis;

if (SpeechRecognition && SpeechSynthesis) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false; // Stop listening after one phrase
    recognition.interimResults = false;

    document.getElementById('voice-toggle').addEventListener('click', () => {
        try {
            recognition.start();
            systemMessage("Listening for command...");
        } catch (e) {
            systemMessage("Error: Recognition service already started or denied.");
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        systemMessage(`Command Received: "${transcript}"`);
        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        systemMessage(`Voice Error: ${event.error}. Click Activate again.`);
    };

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1.2; // Slightly higher pitch for a 'system' voice
        utterance.rate = 1.1;  // Slightly faster rate
        SpeechSynthesis.speak(utterance);
    }

    function processVoiceCommand(command) {
        if (command.includes('log quest complete')) {
            completeDailyQuest();
            speak("Daily Quest protocol completed. Rewards distributed.");
        } else if (command.includes('allocate point to strength')) {
            allocateStat('str');
            speak("Strength attribute increased by one.");
        } else if (command.includes('allocate point to agility')) {
            allocateStat('agi');
            speak("Agility attribute increased by one.");
        } else if (command.includes('what is my level')) {
            speak(`Player, your current Level is ${player.level}.`);
        } else {
            speak("System command not recognized. Please check the command list.");
        }
    }

} else {
    document.getElementById('system-output').textContent = "System Error: Voice commands not supported in this browser.";
    document.getElementById('voice-toggle').disabled = true;
}

// Initialize the UI on page load
updateUI();
