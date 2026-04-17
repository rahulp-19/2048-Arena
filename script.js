// script.js

// Screen switching logic
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// DOM Elements
const boardElement = document.getElementById('game-board');
const currentScoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');
const btnTryAgain = document.getElementById('btn-try-again');
const btnRestart = document.getElementById('btn-restart');
const btnBackMenu = document.getElementById('btn-back-menu');
const btnMenu = document.getElementById('btn-menu');
const btnPlay = document.getElementById('btn-play');
const btnAchievements = document.getElementById('btn-achievements');
const btnSettings = document.getElementById('btn-settings');
const btnCredits = document.getElementById('btn-credits');
const btnToggleSound = document.getElementById('btn-toggle-sound');
const btnResetData = document.getElementById('btn-reset-data');

// Game State
let grid = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
let totalGames = localStorage.getItem('totalGames') ? parseInt(localStorage.getItem('totalGames')) : 0;
const SIZE = 4;
let isGameOver = false;
let isAnimating = false;

// Animation State
let tileIdCounter = 0;
let pendingMerges = [];

// Initialization
bestScoreEl.textContent = bestScore;
if(window.soundManager) {
    btnToggleSound.textContent = soundManager.enabled ? 'ON' : 'OFF';
}

// Listeners for screens
btnMenu.addEventListener('click', () => switchScreen('menu-screen'));
btnBackMenu.addEventListener('click', () => switchScreen('menu-screen'));
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen('menu-screen'));
});
btnAchievements.addEventListener('click', () => switchScreen('achievements-screen'));
btnSettings.addEventListener('click', () => switchScreen('settings-screen'));
btnCredits.addEventListener('click', () => switchScreen('credits-screen'));

// Setup Settings
btnToggleSound.addEventListener('click', () => {
    if(window.soundManager) {
        const isNowEnabled = soundManager.toggle();
        btnToggleSound.textContent = isNowEnabled ? 'ON' : 'OFF';
    }
});

btnResetData.addEventListener('click', () => {
    if(confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        localStorage.clear();
        bestScore = 0;
        totalGames = 0;
        bestScoreEl.textContent = bestScore;
        alert("Data cleared successfully.");
        location.reload();
    }
});

// Setup Board
function initGame() {
    grid = [...Array(SIZE)].map(() => Array(SIZE).fill(null));
    score = 0;
    isGameOver = false;
    currentScoreEl.textContent = '0';
    gameOverModal.classList.add('hidden');
    boardElement.innerHTML = '';
    tileIdCounter = 0;
    pendingMerges = [];
    
    // Create empty cells background
    for(let i=0; i<SIZE*SIZE; i++) {
        let cell = document.createElement('div');
        cell.classList.add('grid-cell');
        boardElement.appendChild(cell);
    }
    
    addRandomTile();
    addRandomTile();
    renderBoard();
}

btnTryAgain.addEventListener('click', () => initGame());
btnRestart.addEventListener('click', () => initGame());

btnPlay.addEventListener('click', () => {
    if(grid.length === 0 || isGameOver) initGame();
    switchScreen('game-screen');
    // Ensure board re-calculates styles accurately if it was hidden
    setTimeout(renderBoard, 10);
});

// Render Board globally
function renderBoard() {
    const gap = 12; // fixed gap matching CSS grid
    const existingTiles = new Set(Array.from(document.querySelectorAll('.tile')).map(t => parseInt(t.dataset.id)));

    // Set r,c on active grid for referencing in merges
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c]) {
                grid[r][c].r = r;
                grid[r][c].c = c;
            }
        }
    }

    // Render active grid
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            let tileData = grid[r][c];
            if (tileData) {
                let tile = document.querySelector(`.tile[data-id='${tileData.id}']`);
                if (!tile) {
                    tile = document.createElement('div');
                    tile.classList.add('tile');
                    tile.dataset.id = tileData.id;
                    boardElement.appendChild(tile);
                    // Pop animation for new
                    setTimeout(() => tile.classList.add('tile-new'), 10);
                }
                
                tile.dataset.value = tileData.val;
                tile.textContent = tileData.val;
                
                tile.style.width = `calc(${100/SIZE}% - ${gap * (SIZE-1)/SIZE}px)`;
                tile.style.height = `calc(${100/SIZE}% - ${gap * (SIZE-1)/SIZE}px)`;
                
                tile.style.top = `calc(${r * (100/SIZE)}% + ${r * gap / SIZE}px)`;
                tile.style.left = `calc(${c * (100/SIZE)}% + ${c * gap / SIZE}px)`;

                if(tileData.isNewMerge) {
                    tile.classList.add('tile-merged');
                    setTimeout(() => tile.classList.remove('tile-merged'), 200);
                    tileData.isNewMerge = false;
                }

                existingTiles.delete(tileData.id);
            }
        }
    }

    // Handle animating dead tiles to their merged destination
    pendingMerges.forEach(merge => {
        let deadTile = document.querySelector(`.tile[data-id='${merge.dead.id}']`);
        if (deadTile) {
            let r = merge.survivor.r;
            let c = merge.survivor.c;
            deadTile.style.top = `calc(${r * (100/SIZE)}% + ${r * gap / SIZE}px)`;
            deadTile.style.left = `calc(${c * (100/SIZE)}% + ${c * gap / SIZE}px)`;
            deadTile.style.zIndex = "1"; // slip behind the survivor
            setTimeout(() => deadTile.remove(), 100); // 100ms matches CSS transition
        }
        existingTiles.delete(merge.dead.id);
    });
    pendingMerges = [];

    // Remove any leftover orphaned tiles
    existingTiles.forEach(id => {
        let tile = document.querySelector(`.tile[data-id='${id}']`);
        if(tile) tile.remove();
    });
}

// Add Tile
function addRandomTile() {
    let emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === null) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length > 0) {
        let rand = Math.floor(Math.random() * emptyCells.length);
        let {r, c} = emptyCells[rand];
        grid[r][c] = {
            id: tileIdCounter++,
            val: Math.random() < 0.9 ? 2 : 4,
            isNewMerge: false
        };
    }
}

// Movement Logic
function slideLine(row) {
    let arr = row.filter(val => val !== null);
    let missing = SIZE - arr.length;
    let zeros = Array(missing).fill(null);
    return arr.concat(zeros); 
}

function combineLine(row) {
    let merged = false;
    for (let i = 0; i < SIZE - 1; i++) {
        if (row[i] !== null && row[i+1] !== null && row[i].val === row[i+1].val) {
            row[i].val *= 2;
            row[i].isNewMerge = true;
            pendingMerges.push({ dead: row[i+1], survivor: row[i] });
            row[i+1] = null; // Consume
            updateScore(row[i].val);
            merged = true;
            if(window.soundManager) soundManager.playMerge(row[i].val);
            window.dispatchEvent(new CustomEvent('tileMerged', { detail: row[i].val }));
        }
    }
    return { row, merged };
}

function updateScore(points) {
    score += points;
    currentScoreEl.textContent = score;
    
    // Score Pop Animation
    const scoreBox = currentScoreEl.parentElement;
    const scorePop = document.createElement('div');
    scorePop.className = 'score-addition';
    scorePop.textContent = `+${points}`;
    scoreBox.appendChild(scorePop);
    setTimeout(() => scorePop.remove(), 800);

    if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
}

function operate(row) {
    row = slideLine(row);
    let result = combineLine(row);
    row = slideLine(result.row);
    return { row, merged: result.merged };
}

function cloneGrid(old) {
    let clone = [];
    for(let r=0; r<SIZE; r++) {
        let row = [];
        for(let c=0; c<SIZE; c++) {
            if (old[r][c]) {
                row.push({id: old[r][c].id, val: old[r][c].val});
            } else {
                row.push(null);
            }
        }
        clone.push(row);
    }
    return clone;
}

// Move Handlers
async function move(direction) {
    if(isGameOver || isAnimating || document.getElementById('game-screen').classList.contains('active') === false) return;
    
    let oldGridStr = JSON.stringify(grid.map(row => row.map(cell => cell ? cell.id +"-"+ cell.val : null)));
    isAnimating = true;

    let totalMerged = false;

    if (direction === 'LEFT') {
        for (let r = 0; r < SIZE; r++) {
            let res = operate(grid[r]);
            grid[r] = res.row;
            if(res.merged) totalMerged = true;
        }
    } else if (direction === 'RIGHT') {
        for (let r = 0; r < SIZE; r++) {
            let res = operate(grid[r].slice().reverse());
            grid[r] = res.row.slice().reverse();
            if(res.merged) totalMerged = true;
        }
    } else if (direction === 'UP') {
        for (let c = 0; c < SIZE; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            let res = operate(col);
            for(let r=0; r<SIZE; r++) grid[r][c] = res.row[r];
            if(res.merged) totalMerged = true;
        }
    } else if (direction === 'DOWN') {
        for (let c = 0; c < SIZE; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            let res = operate(col.slice().reverse());
            let reversed = res.row.slice().reverse();
            for(let r=0; r<SIZE; r++) grid[r][c] = reversed[r];
            if(res.merged) totalMerged = true;
        }
    }

    let newGridStr = JSON.stringify(grid.map(row => row.map(cell => cell ? cell.id +"-"+ cell.val : null)));

    if (oldGridStr !== newGridStr) {
        if (!totalMerged && window.soundManager) soundManager.playMove();
        setTimeout(addRandomTile, 100); // Add randomly after movement animation
        renderBoard(); // Animate movement
        setTimeout(() => {
            renderBoard(); // Animate newly popped tile
            checkGameOver();
        }, 120);
    }
    
    setTimeout(() => { isAnimating = false; }, 130);
}

// Controls: Keyboard
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': move('UP'); break;
        case 'ArrowDown': move('DOWN'); break;
        case 'ArrowLeft': move('LEFT'); break;
        case 'ArrowRight': move('RIGHT'); break;
    }
});

// Controls: Touch/Swipe
let touchStartX = 0;
let touchStartY = 0;

boardElement.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

boardElement.addEventListener('touchmove', e => {
    if(e.cancelable) e.preventDefault(); // Stop iOS elastic scroll bounce
    if (!touchStartX || !touchStartY) return;

    let touchCurrentX = e.changedTouches[0].screenX;
    let touchCurrentY = e.changedTouches[0].screenY;

    const diffX = touchCurrentX - touchStartX;
    const diffY = touchCurrentY - touchStartY;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    if (Math.max(absX, absY) > 40) { // Instant trigger threshold reached
        if (absX > absY) {
            if (diffX > 0) move('RIGHT');
            else move('LEFT');
        } else {
            if (diffY > 0) move('DOWN');
            else move('UP');
        }
        // Reset start to prevent multiple moves from one continuous swipe
        touchStartX = 0; 
        touchStartY = 0;
    }
}, {passive: false});

boardElement.addEventListener('touchend', e => {
    // Clean up
    touchStartX = 0;
    touchStartY = 0;
}, {passive: true});

// Game Over Logic
function checkGameOver() {
    let movesAvailable = false;
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            if(grid[r][c] === null) movesAvailable = true;
            if(c < SIZE-1 && grid[r][c] !== null && grid[r][c+1] !== null && grid[r][c].val === grid[r][c+1].val) movesAvailable = true;
            if(r < SIZE-1 && grid[r][c] !== null && grid[r+1][c] !== null && grid[r][c].val === grid[r+1][c].val) movesAvailable = true;
        }
    }
    
    if (!movesAvailable) {
        isGameOver = true;
        finalScoreEl.textContent = score;
        gameOverModal.classList.remove('hidden');
        if(window.soundManager) soundManager.playGameOver();
        saveProgressLocal();
    }
}

// Save to LocalStorage
function saveProgressLocal() {
    totalGames++;
    localStorage.setItem('totalGames', totalGames);
    
    if (score > bestScore) {
        bestScore = score;
        bestScoreEl.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
    
    // Dispatch Event for Achievements check
    window.dispatchEvent(new Event('scoreSaved'));
}

// Resize listener
window.addEventListener('resize', () => {
    if(document.getElementById('game-screen').classList.contains('active')) {
        renderBoard();
    }
});
