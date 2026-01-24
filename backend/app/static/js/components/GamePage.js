// Game Page Component
class GamePage {
    constructor() {
        this.playerData = null;
        this.currentEnemy = null;
        this.locationWatcher = null;
        this.cameraStream = null;
    }

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="game-container">
                <div class="game-header">
                    <div class="player-info">
                        <span class="level">Level: <span id="player-level">1</span></span>
                        <span class="xp">XP: <span id="player-xp">0</span></span>
                    </div>
                    <button class="btn-back" onclick="router.navigate('/')">← Back</button>
                </div>

                <div class="ar-container">
                    <video id="cam" autoplay playsinline></video>
                    <div class="game-overlay">
                        <div id="enemy-container" class="enemy-container"></div>
                        <div id="game-log" class="game-log"></div>
                    </div>
                </div>

                <div class="game-controls">
                    <div id="combat-controls" class="combat-controls" style="display: none;">
                        <button class="btn-attack" onclick="gamePage.attack('enemy')">⚔️ Attack</button>
                        <button class="btn-heal" onclick="gamePage.heal()">💚 Heal</button>
                    </div>
                    <div id="status-message" class="status-message">
                        📍 Move around to find enemies...
                    </div>
                </div>
            </div>
        `;

        this.initializeGame();
    }

    async initializeGame() {
        await this.setupCamera();
        this.setupLocationTracking();
        await this.loadPlayerData();
    }

    async setupCamera() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                document.getElementById("cam").srcObject = this.cameraStream;
            } else {
                throw new Error("Camera API not available");
            }
        } catch (err) {
            console.log("Camera access denied:", err);
            document.getElementById("cam").style.display = "none";
        }
    }

    setupLocationTracking() {
        if (navigator.geolocation) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                pos => this.handleLocationUpdate(pos),
                err => console.log("Location access denied:", err),
                { enableHighAccuracy: true }
            );
        } else {
            console.log("Geolocation not available");
        }
    }

    async handleLocationUpdate(position) {
        try {
            const response = await fetch('/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                })
            });
            
            const data = await response.json();
            if (data.spawn) {
                this.spawnEnemy(data.enemy);
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }

    spawnEnemy(enemyType) {
        this.currentEnemy = enemyType;
        const enemyContainer = document.getElementById('enemy-container');
        const combatControls = document.getElementById('combat-controls');
        const statusMessage = document.getElementById('status-message');
        
        enemyContainer.innerHTML = `
            <div class="enemy">
                <div class="enemy-icon">${this.getEnemyIcon(enemyType)}</div>
                <div class="enemy-info">
                    <h3>${enemyType.toUpperCase()}</h3>
                    <p>Wild enemy appeared!</p>
                </div>
            </div>
        `;
        
        combatControls.style.display = 'flex';
        statusMessage.textContent = `⚔️ A ${enemyType} appeared!`;
    }

    getEnemyIcon(enemyType) {
        const icons = {
            class1: '👹',
            class2: '👺',
            class3: '🐉'
        };
        return icons[enemyType] || '👾';
    }

    async attack(enemy) {
        if (!this.currentEnemy) return;

        try {
            const response = await fetch('/attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enemy: this.currentEnemy })
            });
            
            const data = await response.json();
            this.updatePlayerStats(data);
            this.clearEnemy();
            
            document.getElementById('game-log').innerHTML = `
                <div class="log-entry success">
                    ⚔️ Defeated ${this.currentEnemy}! +${this.getXPForEnemy(this.currentEnemy)} XP
                </div>
            `;
        } catch (error) {
            console.error('Error attacking:', error);
        }
    }

    heal() {
        document.getElementById('game-log').innerHTML = `
            <div class="log-entry heal">
                💚 Healed yourself!
            </div>
        `;
    }

    clearEnemy() {
        this.currentEnemy = null;
        document.getElementById('enemy-container').innerHTML = '';
        document.getElementById('combat-controls').style.display = 'none';
        document.getElementById('status-message').textContent = '📍 Move around to find enemies...';
    }

    async loadPlayerData() {
        try {
            const response = await fetch('/leaderboard');
            const data = await response.json();
            this.updatePlayerStats(data);
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }

    updatePlayerStats(data) {
        document.getElementById('player-level').textContent = data.level || 1;
        document.getElementById('player-xp').textContent = data.xp || 0;
        this.playerData = data;
    }

    getXPForEnemy(enemyType) {
        const xpValues = { class1: 10, class2: 25, class3: 50 };
        return xpValues[enemyType] || 10;
    }

    cleanup() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
        }
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
    }
}

const gamePage = new GamePage();
