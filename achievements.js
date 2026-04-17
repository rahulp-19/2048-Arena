// achievements.js

const achievementsList = document.getElementById('achievements-list');
const toastContainer = document.getElementById('toast-container');

// Achievement Definitions
const ACHIEVEMENTS = [
    { id: 'first_merge', icon: '✨', title: 'First Merge', desc: 'Merge two tiles for the first time.', condition: 'merge:4' },
    { id: 'reach_128', icon: '🚀', title: 'Getting Fast', desc: 'Create a 128 tile.', condition: 'merge:128' },
    { id: 'reach_512', icon: '🔥', title: 'On Fire', desc: 'Create a 512 tile.', condition: 'merge:512' },
    { id: 'reach_2048', icon: '👑', title: 'Arena Master', desc: 'Create the 2048 tile! You won!', condition: 'merge:2048' },
    { id: 'score_5000', icon: '💯', title: 'High Scorer', desc: 'Reach a score of 5,000.', condition: 'score:5000' },
    { id: 'play_10_games', icon: '🕹️', title: 'Arcade Addict', desc: 'Play 10 games.', condition: 'games:10' }
];

// Memory cache
let unlockedIds = new Set();
let storedIds = localStorage.getItem('achievements');
if (storedIds) {
    try {
        unlockedIds = new Set(JSON.parse(storedIds));
    } catch(e) {
        console.error("Could not parse achievements from localStorage");
    }
}

// Render UI grid
function renderAchievements() {
    if (!achievementsList) return;
    achievementsList.innerHTML = '';
    
    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedIds.has(ach.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
        
        card.innerHTML = `
            <div class="ach-icon">${ach.icon}</div>
            <div class="ach-info">
                <h4>${ach.title}</h4>
                <p>${ach.desc}</p>
            </div>
        `;
        achievementsList.appendChild(card);
    });
}

// Check unlocking logic
function checkUnlock(ach) {
    if(unlockedIds.has(ach.id)) return; // Already unlocked

    // Process Unlock
    unlockedIds.add(ach.id);
    
    showToast(ach.title, ach.icon);
    renderAchievements(); // Update screen silently if open
    
    // Save to LocalStorage
    const arr = Array.from(unlockedIds);
    localStorage.setItem('achievements', JSON.stringify(arr));
}

// Initial render
renderAchievements();

// Listeners
window.addEventListener('tileMerged', (e) => {
    const tileVal = e.detail;
    ACHIEVEMENTS.forEach(ach => {
        if(ach.condition === `merge:${tileVal}`) {
            checkUnlock(ach);
        }
    });
});

window.addEventListener('scoreSaved', () => {
    const highestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
    const totalGames = localStorage.getItem('totalGames') ? parseInt(localStorage.getItem('totalGames')) : 0;
    
    ACHIEVEMENTS.forEach(ach => {
        if(ach.condition === 'score:5000' && highestScore >= 5000) {
            checkUnlock(ach);
        }
        if(ach.condition === 'games:10' && totalGames >= 10) {
            checkUnlock(ach);
        }
    });
});

// Toast UI
function showToast(title, icon) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div>
            <div style="font-size: 0.8rem; color: var(--accent-dark);">Achievement Unlocked</div>
            <strong style="color: var(--accent-neon);">${title}</strong>
        </div>
    `;
    if(toastContainer) toastContainer.appendChild(toast);
    
    // Cleanup DOM after animation
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
