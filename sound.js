// sound.js

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const soundManager = {
    enabled: localStorage.getItem('soundEnabled') !== 'false', // Default true

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    },

    playTone(freq, type, duration, vol) {
        if (!this.enabled) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    },

    playMove() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        this.playTone(150, 'sine', 0.1, 0.1);
    },

    playMerge(value) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        // Higher pitch for larger merges
        const baseFreq = 400;
        const multiplier = Math.log2(value) || 1;
        this.playTone(baseFreq + (multiplier * 50), 'sine', 0.2, 0.15);
    },

    playGameOver() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        this.playTone(100, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(50, 'sawtooth', 0.8, 0.2), 200);
    }
};

window.soundManager = soundManager; // Expose globally if needed
