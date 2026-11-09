class Stopwatch {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.laps = [];
        
        // DOM Elements
        this.displayTotal = document.getElementById('displayTotal');
        this.displayLap = document.getElementById('displayLap');
        this.lapsList = document.getElementById('lapsList');
        this.btnStart = document.getElementById('btnStart');
        this.btnLap = document.getElementById('btnLap');
        this.btnReset = document.getElementById('btnReset');

        // Bind Events
        this.btnStart.addEventListener('click', () => this.toggle());
        this.btnReset.addEventListener('click', () => this.reset());
        this.btnLap.addEventListener('click', () => this.recordLap());

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
            if (e.code === 'KeyL') this.recordLap();
            if (e.code === 'KeyR') this.reset();
        });

        // Load State from LocalStorage
        this.loadState();
        
        // Start Animation Loop
        requestAnimationFrame(this.update.bind(this));
    }

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now() - this.elapsedTime;
            this.updateUIState();
            this.saveState();
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.elapsedTime = Date.now() - this.startTime;
            this.updateUIState();
            this.saveState();
        }
    }

    reset() {
        this.isRunning = false;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.laps = [];
        this.clearLapsUI();
        this.updateDisplay(0, 0);
        this.updateUIState();
        localStorage.removeItem('stopwatchState');
    }

    recordLap() {
        if (!this.isRunning) return;

        const totalTime = Date.now() - this.startTime;
        // Calculate split time (Total - Sum of previous laps)
        const prevLapsTotal = this.laps.reduce((acc, lap) => acc + lap.split, 0);
        const currentSplit = totalTime - prevLapsTotal;

        const lapData = {
            index: this.laps.length + 1,
            split: currentSplit,
            total: totalTime
        };

        this.laps.push(lapData);
        this.renderLap(lapData);
        this.saveState();
    }

    update() {
        if (this.isRunning) {
            const currentTime = Date.now();
            const totalTime = currentTime - this.startTime;
            
            // Calculate current lap time dynamically for display
            const prevLapsTotal = this.laps.reduce((acc, lap) => acc + lap.split, 0);
            const currentLapTime = totalTime - prevLapsTotal;

            this.updateDisplay(totalTime, currentLapTime);
        }
        requestAnimationFrame(this.update.bind(this));
    }

    formatTime(ms) {
        const date = new Date(ms);
        const m = String(date.getUTCMinutes()).padStart(2, '0');
        const s = String(date.getUTCSeconds()).padStart(2, '0');
        const cs = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
        return `${m}:${s}.${cs}`;
    }

    updateDisplay(total, lap) {
        this.displayTotal.textContent = this.formatTime(total);
        this.displayLap.textContent = this.formatTime(lap);
        document.title = this.isRunning ? this.formatTime(total) : 'Stopwatch';
    }

    renderLap(lap) {
        const li = document.createElement('li');
        li.className = 'lap-item';
        li.innerHTML = `
            <span>#${lap.index}</span>
            <span>${this.formatTime(lap.split)}</span>
            <span>${this.formatTime(lap.total)}</span>
        `;
        // Prepend to list
        this.lapsList.prepend(li);
    }

    clearLapsUI() {
        this.lapsList.innerHTML = '';
    }

    updateUIState() {
        if (this.isRunning) {
            this.btnStart.textContent = 'Pause';
            this.btnStart.style.backgroundColor = '#ffc107'; // Yellow for pause
            this.btnStart.style.color = '#000';
            this.btnLap.disabled = false;
            this.btnReset.disabled = false;
        } else {
            this.btnStart.textContent = 'Start';
            this.btnStart.style.backgroundColor = ''; // Revert to CSS default
            this.btnStart.style.color = '';
            this.btnLap.disabled = true;
            this.btnReset.disabled = this.elapsedTime === 0; // Disable only if fresh
        }
    }

    saveState() {
        const state = {
            startTime: this.startTime,
            elapsedTime: this.elapsedTime,
            isRunning: this.isRunning,
            laps: this.laps
        };
        localStorage.setItem('stopwatchState', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('stopwatchState');
        if (saved) {
            const state = JSON.parse(saved);
            this.startTime = state.startTime;
            this.elapsedTime = state.elapsedTime;
            this.isRunning = state.isRunning;
            this.laps = state.laps || [];

            // If it was running, we don't need to change anything; 
            // Date.now() - startTime will naturally account for the time passed while closed.
            
            // Render previous laps
            this.laps.forEach(lap => this.renderLap(lap));
            
            this.updateUIState();
            
            // If paused, show the frozen time immediately
            if (!this.isRunning && this.elapsedTime > 0) {
                 this.updateDisplay(this.elapsedTime, 0); // Lap display reset on pause logic can be debated, but simpler here
            }
        }
    }
}

// Initialize
const stopwatch = new Stopwatch();
