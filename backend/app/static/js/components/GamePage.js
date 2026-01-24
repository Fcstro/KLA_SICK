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
                        <div class="player-stats">
                            <span class="level">Level: <span id="player-level">1</span></span>
                            <span class="xp">XP: <span id="player-xp">0</span></span>
                        </div>
                        <div class="player-health-container">
                            <div class="health-bar player-health-bar">
                                <div class="health-fill player-health-fill" style="width: 100%"></div>
                            </div>
                            <span class="health-text player-health-text">HP: --/--</span>
                        </div>
                    </div>
                    <button class="btn-back" onclick="window.router.navigate('/')">← Back</button>
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
                    <div class="debug-controls">
                        <button class="btn-debug" onclick="gamePage.spawnTestEnemy()">🐉 Test Dragon (100%)</button>
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
                this.spawnEnemy(data.enemy, data.enemy_stats);
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }

    spawnEnemy(enemyType, enemyStats = null) {
        this.currentEnemy = enemyType;
        const enemyContainer = document.getElementById('enemy-container');
        const combatControls = document.getElementById('combat-controls');
        const statusMessage = document.getElementById('status-message');
        
        // Use provided stats or default stats
        const stats = enemyStats || {
            hp: this.getDefaultEnemyHP(enemyType),
            max_hp: this.getDefaultEnemyHP(enemyType),
            atk: this.getDefaultEnemyATK(enemyType),
            name: this.getEnemyName(enemyType)
        };
        
        enemyContainer.innerHTML = `
            <div class="enemy ${enemyType}">
                <div class="enemy-visual">
                    <img src="/static/assets/enemies/${enemyType}.png" 
                         alt="${enemyType} enemy" 
                         class="enemy-image"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="enemy-icon-fallback">${this.getEnemyIcon(enemyType)}</div>
                </div>
                <div class="enemy-info">
                    <h3>${stats.name}</h3>
                    <div class="health-bar-container">
                        <div class="health-bar enemy-health-bar">
                            <div class="health-fill enemy-health-fill" style="width: 100%"></div>
                        </div>
                        <span class="health-text enemy-health-text">HP: ${stats.hp}/${stats.max_hp}</span>
                    </div>
                    <p>Wild enemy appeared!</p>
                </div>
            </div>
        `;
        
        combatControls.style.display = 'flex';
        statusMessage.textContent = `⚔️ A ${stats.name} appeared!`;
    }

    getEnemyIcon(enemyType) {
        const icons = {
            class1: '👹',
            class2: '👺',
            class3: '🐉'
        };
        return icons[enemyType] || '👾';
    }

    getEnemyName(enemyType) {
        const names = {
            class1: 'Goblin',
            class2: 'Orc',
            class3: 'Dragon'
        };
        return names[enemyType] || 'Monster';
    }

    getDefaultEnemyHP(enemyType) {
        const hp = {
            class1: 30,
            class2: 50,
            class3: 100
        };
        return hp[enemyType] || 30;
    }

    getDefaultEnemyATK(enemyType) {
        const atk = {
            class1: 5,
            class2: 10,
            class3: 15
        };
        return atk[enemyType] || 5;
    }

    async attack(enemy) {
        if (!this.currentEnemy) return;

        try {
            const response = await fetch('/player-attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enemy: this.currentEnemy })
            });
            
            const data = await response.json();
            
            if (data.enemy_defeated) {
                // Enemy defeated
                this.updatePlayerStats(data.player);
                this.clearEnemy();
                
                document.getElementById('game-log').innerHTML = `
                    <div class="log-entry success">
                        ⚔️ You dealt ${data.player_attack} damage and defeated the ${data.enemy_type}!
                        +${this.getXPForEnemy(data.enemy_type)} XP
                    </div>
                ` + document.getElementById('game-log').innerHTML;
            } else {
                // Enemy survived and counter-attacked
                this.updatePlayerStats({current_hp: data.player_hp, max_hp: this.playerData?.max_hp || 100});
                this.updateEnemyHealthBar(data.enemy_hp, data.enemy_stats.max_hp);
                
                document.getElementById('game-log').innerHTML = `
                    <div class="log-entry combat">
                        ⚔️ You dealt ${data.player_attack} damage! Enemy HP: ${data.enemy_hp}/${data.enemy_stats.max_hp}
                        💥 Enemy counter-attacked for ${data.enemy_attack} damage! Your HP: ${data.player_hp}
                    </div>
                ` + document.getElementById('game-log').innerHTML;
                
                if (data.player_hp <= 0) {
                    this.gameOver();
                }
            }
        } catch (error) {
            console.error('Error attacking:', error);
        }
    }

    updateEnemyHealthBar(currentHp, maxHp) {
        const healthPercent = (currentHp / maxHp) * 100;
        const enemyHealthFill = document.querySelector('.enemy-health-fill');
        const enemyHealthText = document.querySelector('.enemy-health-text');
        
        if (enemyHealthFill && enemyHealthText) {
            enemyHealthFill.style.width = healthPercent + '%';
            enemyHealthText.textContent = `HP: ${currentHp}/${maxHp}`;
            
            // Change color based on HP level
            if (healthPercent <= 25) {
                enemyHealthFill.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
            } else if (healthPercent <= 50) {
                enemyHealthFill.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
            } else {
                enemyHealthFill.style.background = 'linear-gradient(90deg, #9c27b0, #7b1fa2)';
            }
        }
    }

    async heal() {
        try {
            const response = await fetch('/heal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            this.updatePlayerStats({current_hp: data.current_hp, max_hp: data.max_hp});
            
            document.getElementById('game-log').innerHTML = `
                <div class="log-entry heal">
                    💚 Healed for ${data.healed} HP! Current HP: ${data.current_hp}/${data.max_hp}
                </div>
            ` + document.getElementById('game-log').innerHTML;
        } catch (error) {
            console.error('Error healing:', error);
        }
    }

    gameOver() {
        document.getElementById('status-message').textContent = '💀 You were defeated! Returning to character selection...';
        setTimeout(() => {
            window.router.navigate('/');
        }, 3000);
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
        
        if (data.current_hp !== undefined && data.max_hp !== undefined) {
            const healthPercent = (data.current_hp / data.max_hp) * 100;
            document.querySelector('.player-health-fill').style.width = healthPercent + '%';
            document.querySelector('.player-health-text').textContent = `HP: ${data.current_hp}/${data.max_hp}`;
            
            // Change color based on HP level
            const healthFill = document.querySelector('.player-health-fill');
            if (healthPercent <= 25) {
                healthFill.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
            } else if (healthPercent <= 50) {
                healthFill.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #4caf50, #388e3c)';
            }
        }
        
        this.playerData = data;
    }

    getXPForEnemy(enemyType) {
        const xpValues = { class1: 10, class2: 25, class3: 50 };
        return xpValues[enemyType] || 10;
    }

    spawnTestEnemy() {
        // For testing - always spawn class3 enemy (100% for testing)
        const enemyType = 'class3';
        const enemyStats = {
            hp: this.getDefaultEnemyHP(enemyType),
            max_hp: this.getDefaultEnemyHP(enemyType),
            atk: this.getDefaultEnemyATK(enemyType),
            name: this.getEnemyName(enemyType)
        };
        
        console.log(`🐉 DEBUG: Spawning test enemy - ${enemyStats.name} with HP: ${enemyStats.hp}/${enemyStats.max_hp}`);
        this.spawnEnemy(enemyType, enemyStats);
        
        // Add log entry
        const gameLog = document.getElementById('game-log');
        gameLog.innerHTML = `
            <div class="log-entry debug">
                🐉 DEBUG: Test enemy spawned! (${enemyStats.name} - HP: ${enemyStats.hp}/${enemyStats.max_hp})
            </div>
        ` + gameLog.innerHTML;
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
