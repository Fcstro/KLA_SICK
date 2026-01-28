// Game Page Component
class GamePage {
    constructor() {
        this.playerData = null;
        this.currentEnemy = null;
        this.locationWatcher = null;
        this.cameraStream = null;
        this.threeScene = null;
        this.threeRenderer = null;
        this.threeCamera = null;
        this.enemyModel = null;
        this.animationMixer = null;
        this.enemyAnimations = {};
        
        // Auto-spawn properties
        this.autoSpawnEnabled = false;
        this.autoSpawnInterval = null;
        this.autoSpawnMode = 'location'; // 'location' or 'time-based'
        this.autoSpawnTime = 15000; // 15 seconds default
        
        // Location error tracking
        this.locationErrorCount = 0;
        this.maxLocationErrors = 3;
        
        // Game State
        this.gameState = {
            playerId: null,
            player: null,
            enemy: null,
            inCombat: false,
            lastLocation: null,
            characterClass: null
        };
        
        // Backend Configuration (will be fetched from server)
        this.gameConfig = {
            ENEMY_STATS: null,
            CHARACTERS: null,
            SKILLS: null,
            SPAWN_CONFIG: null,
            GAME_CONSTANTS: null
        };
        
        // Character Abilities (will be populated from backend config)
        this.characterAbilities = {};
    }

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="game-container">
                <div class="game-header">
                    <div class="game-title">
                        <div class="logo-container">
                            <span class="word left">KLA</span>
                            <span class="word right">SICK</span>
                        </div>
                    </div>
                </div>
                
                <div class="player-stats">
                    <div class="hp-container">
                        <div class="hp-bar">
                            <div class="hp-fill" id="playerHpFill" style="width: 100%"></div>
                            <div class="hp-text" id="playerHpText">100/100</div>
                        </div>
                    </div>
                    <div class="stat-item level">Level: <span id="level">1</span></div>
                    <div class="stat-item xp">XP: <span id="xp">0</span></div>
                </div>
                
                <button class="btn-back" onclick="window.router.navigate('/')">← Back</button>

                <div class="ar-container">
                    <video id="cam" autoplay playsinline></video>
                    <div class="game-overlay">
                        <div id="enemy-container" class="enemy-container" style="display: none;">
                            <div class="enemy-info">
                                <div class="enemy-name" id="enemyName">Goblin</div>
                                <div class="enemy-health-bar">
                                    <div class="enemy-health-fill" id="enemyHealthFill" style="width: 100%"></div>
                                    <div id="enemyStats">HP: 30/30</div>
                                </div>
                            </div>
                            <div id="enemy-3d-container" class="enemy-3d-container"></div>
                        </div>
                        <div id="game-log" class="game-log"></div>
                        <div id="messageArea" class="message-overlay"></div>
                    </div>
                </div>

                <div class="game-controls">
                    <div class="game-action-buttons" id="actionButtons">
                        <button class="action-button" id="attackBtn" onclick="gamePage.playerAttack()">Attack</button>
                        <button class="action-button" id="skillBtn" onclick="gamePage.useSkill()">Skill</button>
                        <button class="action-button" id="healBtn" onclick="gamePage.heal()">Heal</button>
                        <button class="action-button" id="escapeBtn" onclick="gamePage.escape()">Escape</button>
                    </div>
                </div>

                <!-- Debug Toggle (Fixed Position) -->
                <button class="debug-toggle" onclick="gamePage.toggleDebugModal()">⚙️</button>

                <!-- Debug Modal -->
                <div id="debugModal" class="debug-modal" style="display: none;">
                    <div class="debug-modal-content">
                        <div class="debug-modal-header">
                            <h3>Debug Controls</h3>
                            <button class="debug-close" onclick="gamePage.closeDebugModal()">×</button>
                        </div>
                        <div class="debug-info">
                            <p><small>💡 <strong>Desktop:</strong> Press <kbd>Ctrl+D</kbd> to toggle • Press <kbd>ESC</kbd> to close</small></p>
                            <p><small>📱 <strong>Mobile:</strong> Double-tap header • Long-press ⚙️ • Swipe down from top</small></p>
                            <p><small>🖱️ <strong>All:</strong> Click outside to close • Tap ⚙️ button</small></p>
                        </div>
                        <div class="debug-controls">
                            <button class="btn-debug" onclick="gamePage.forceLocationUpdate()">Force Location Update</button>
                            <button class="btn-debug" onclick="gamePage.spawnTestEnemy('class1')">Spawn Goblin</button>
                            <button class="btn-debug" onclick="gamePage.spawnTestEnemy('class2')">Spawn Orc</button>
                            <button class="btn-debug" onclick="gamePage.spawnTestEnemy('class3')">Spawn Dragon</button>
                            <button class="btn-debug" onclick="gamePage.clearEnemy()">Clear Enemy</button>
                            <button class="btn-debug" onclick="gamePage.testCombat()">Test Combat</button>
                            <button class="btn-debug" id="autoSpawnBtn" onclick="gamePage.toggleAutoSpawn()">Enable Auto Spawn</button>
                            <button class="btn-debug" id="timeBasedSpawnBtn" onclick="gamePage.toggleTimeBasedSpawn()">Time-Based Mode (15s)</button>
                            <button class="btn-debug" id="fastSpawnBtn" onclick="gamePage.toggleFastSpawn()">Fast Mode (5s)</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add class to prevent scrolling during gameplay
        document.body.classList.add('game-page-body');
        
        this.initializeGame();
    }

    async fetchGameConfig() {
        try {
            console.log('🔄 Fetching game configuration from backend...');
            
            // Fetch all configuration endpoints
            const [enemyStats, characters, skills, spawnConfig, gameConstants] = await Promise.all([
                fetch('/config/enemy-stats').then(r => r.json()),
                fetch('/config/characters').then(r => r.json()),
                fetch('/config/skills').then(r => r.json()),
                fetch('/config/spawn-config').then(r => r.json()),
                fetch('/config/game-constants').then(r => r.json())
            ]);
            
            this.gameConfig = {
                ENEMY_STATS: enemyStats,
                CHARACTERS: characters,
                SKILLS: skills,
                SPAWN_CONFIG: spawnConfig,
                GAME_CONSTANTS: gameConstants
            };
            
            console.log('✅ Game configuration loaded:', this.gameConfig);
            
            // Update character abilities based on fetched config
            this.updateCharacterAbilities();
            
        } catch (error) {
            console.error('❌ Failed to fetch game config:', error);
            // Fallback to hardcoded values if backend fails
            this.initializeFallbackConfig();
        }
    }
    
    updateCharacterAbilities() {
        if (!this.gameConfig.SKILLS) return;
        
        this.characterAbilities = {};
        for (const [characterClass, skills] of Object.entries(this.gameConfig.SKILLS)) {
            this.characterAbilities[characterClass] = {
                attack: skills[0]?.name || 'Attack',
                skill: skills[1]?.name || 'Skill',
                heal: skills[2]?.name || 'Heal'
            };
        }
    }
    
    initializeFallbackConfig() {
        console.log('🔄 Using fallback configuration...');
        // Fallback to existing hardcoded values
        this.gameConfig = {
            ENEMY_STATS: {
                "class1": {"hp": 30, "atk": 5, "name": "Goblin", "xp_reward": 10},
                "class2": {"hp": 50, "atk": 10, "name": "Orc", "xp_reward": 25},
                "class3": {"hp": 100, "atk": 15, "name": "Dragon", "xp_reward": 50}
            },
            CHARACTERS: {
                "warrior": {"hp": 120, "atk": 15, "class": "warrior"},
                "mage": {"hp": 80, "atk": 25, "class": "mage"},
                "archer": {"hp": 100, "atk": 18, "class": "archer"},
                "healer": {"hp": 110, "atk": 12, "class": "healer"},
                "rogue": {"hp": 90, "atk": 20, "class": "rogue"}
            },
            SKILLS: null, // Will use existing hardcoded skills
            SPAWN_CONFIG: {
                "spawn_distance": 5,
                "spawn_probability": 1,
                "enemy_weights": {"class1": 0.5, "class2": 0.3, "class3": 0.2},
                "max_enemies_per_area": 3,
                "spawn_cooldown": 10,
                "area_radius": 50
            },
            GAME_CONSTANTS: {
                "HEAL_COOLDOWN": 10,
                "HEAL_AMOUNT": 25,
                "CRIT_CHANCE": 0.1,
                "CRIT_MULTIPLIER": 2.0,
                "DODGE_CHANCE": 0.05
            }
        };
    }
    
    async initializeGame() {
        // Fetch game configuration from backend first
        await this.fetchGameConfig();
        
        // Load player data from localStorage
        this.loadPlayerData();
        await this.setupCamera();
        this.setupLocationTracking();
        this.setupThreeJS();
        this.updateStats();
        this.updateAbilityButtons();
        this.setupDebugModal();
        this.showMessage('Game loaded! Start moving to find enemies.', 'success');
    }

    setupDebugModal() {
        // Add keyboard shortcut (Ctrl+D or Cmd+D)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugModal();
            }
            if (e.key === 'Escape') {
                this.closeDebugModal();
            }
        });

        // Add click outside to close
        const modal = document.getElementById('debugModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDebugModal();
                }
            });
        }

        // Add mobile touch gestures
        this.setupMobileDebugAccess();
    }

    setupMobileDebugAccess() {
        // Add double-tap gesture to open debug modal on mobile
        let tapCount = 0;
        let tapTimeout;
        
        document.addEventListener('touchstart', (e) => {
            // Only detect taps on game header area
            const gameHeader = document.querySelector('.game-header');
            if (gameHeader && gameHeader.contains(e.target)) {
                tapCount++;
                
                if (tapCount === 1) {
                    tapTimeout = setTimeout(() => {
                        tapCount = 0;
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimeout);
                    tapCount = 0;
                    this.toggleDebugModal();
                    this.showMessage('🔧 Debug menu opened! Double-tap header again to close.', 'success');
                }
            }
        });

        // Add long press gesture (3 seconds) on settings button
        const debugToggle = document.querySelector('.debug-toggle');
        if (debugToggle) {
            let pressTimer;
            
            debugToggle.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.showMessage('🔧 Debug menu opened! Press ESC or tap outside to close.', 'success');
                    this.toggleDebugModal();
                }, 2000); // 2 second long press
            });
            
            debugToggle.addEventListener('touchend', (e) => {
                clearTimeout(pressTimer);
            });
        }

        // Add swipe down gesture from top of screen
        let touchStartY = 0;
        let touchStartX = 0;
        
        document.addEventListener('touchstart', (e) => {
            // Only detect swipes at top 20% of screen
            if (e.touches[0].clientY < window.innerHeight * 0.2) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (touchStartY === 0) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const deltaY = touchEndY - touchStartY;
            const deltaX = Math.abs(touchEndX - touchStartX);
            
            // Swipe down gesture (minimum 50px down, less than 50px horizontal movement)
            if (deltaY > 50 && deltaX < 50) {
                this.toggleDebugModal();
                this.showMessage('🔧 Debug menu opened! Swipe down again to close.', 'success');
            }
            
            touchStartY = 0;
            touchStartX = 0;
        });
    }

    toggleDebugModal() {
        const modal = document.getElementById('debugModal');
        if (modal.style.display === 'none') {
            modal.style.display = 'flex';
            console.log('🔧 Debug modal opened (Press ESC or click outside to close)');
        } else {
            this.closeDebugModal();
        }
    }

    closeDebugModal() {
        const modal = document.getElementById('debugModal');
        modal.style.display = 'none';
        console.log('🔧 Debug modal closed');
    }

    loadPlayerData() {
        try {
            const playerData = localStorage.getItem('playerData');
            if (playerData) {
                const data = JSON.parse(playerData);
                this.gameState.playerId = data.playerId;
                this.gameState.player = data.player;
                this.gameState.characterClass = data.characterClass;
                console.log('Player data loaded:', this.gameState);
            } else {
                console.error('No player data found!');
                this.showMessage('No player data found. Please select a character first.', 'error');
                setTimeout(() => {
                    window.router.navigate('/character');
                }, 2000);
            }
        } catch (error) {
            console.error('Error loading player data:', error);
            this.showMessage('Error loading player data.', 'error');
        }
    }

    async setupCamera() {
        try {
            console.log('🎥 Setting up AR camera...');
            
            // Check if running on HTTPS or localhost
            const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (!isSecure) {
                throw new Error("Camera access requires HTTPS or localhost. Please run the app on a secure server.");
            }
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not available in this browser");
            }
            
            // Request camera permission with environment-facing camera
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            console.log('✅ Camera stream obtained:', this.cameraStream);
            console.log('📹 Stream active:', this.cameraStream.active);
            console.log('📹 Stream tracks:', this.cameraStream.getTracks().length);
            
            const videoElement = document.getElementById("cam");
            if (videoElement) {
                console.log('✅ Video element found:', videoElement);
                console.log('🎥 Video element in DOM:', document.contains(videoElement));
                console.log('🎥 Video element parent:', videoElement.parentElement);
                console.log('🎥 Video element rect:', videoElement.getBoundingClientRect());
                
                // Add immediate visual test - make video element bright green to verify it's visible
                videoElement.style.background = 'lime';
                setTimeout(() => {
                    videoElement.style.background = 'black';
                }, 1000);
                
                console.log('🎥 Video element styles before:', {
                    display: getComputedStyle(videoElement).display,
                    width: getComputedStyle(videoElement).width,
                    height: getComputedStyle(videoElement).height,
                    zIndex: getComputedStyle(videoElement).zIndex,
                    opacity: getComputedStyle(videoElement).opacity,
                    visibility: getComputedStyle(videoElement).visibility
                });
                
                // Immediately attach stream and force visibility
                videoElement.srcObject = this.cameraStream;
                console.log('✅ Camera stream attached to video element');
                
                // Force video element to be visible immediately
                videoElement.style.cssText = `
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: 100vw !important;
                    max-height: 100vh !important;
                    min-height: 100vh !important;
                    object-fit: cover !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    z-index: 1 !important;
                    background: black !important;
                `;
                
                console.log('🎥 Forced video styles applied with cssText');
                console.log('🎥 Video element styles after:', {
                    display: getComputedStyle(videoElement).display,
                    width: getComputedStyle(videoElement).width,
                    height: getComputedStyle(videoElement).height,
                    zIndex: getComputedStyle(videoElement).zIndex,
                    opacity: getComputedStyle(videoElement).opacity,
                    visibility: getComputedStyle(videoElement).visibility
                });
                
                // Wait for video to be ready
                videoElement.onloadedmetadata = () => {
                    console.log('✅ Camera stream loaded metadata. Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                    
                    // Force height again after metadata loads
                    videoElement.style.height = '100vh !important';
                    videoElement.style.minHeight = '100vh !important';
                    console.log('🎥 Height forced after metadata load:', getComputedStyle(videoElement).height);
                    
                    // Try to play immediately
                    videoElement.play().then(() => {
                        console.log('✅ Video play successful');
                        this.showMessage('🎥 AR camera activated!', 'success');
                    }).catch(err => {
                        console.error('❌ Video play failed:', err);
                        console.log('🔄 Attempting to play with user interaction...');
                        
                        // Add click listener to start video on user interaction
                        const startVideo = () => {
                            videoElement.play().then(() => {
                                console.log('✅ Video play successful after user interaction');
                                this.showMessage('🎥 AR camera activated!', 'success');
                                document.removeEventListener('click', startVideo);
                                document.removeEventListener('touchstart', startVideo);
                            }).catch(err => {
                                console.error('❌ Video still failed after user interaction:', err);
                            });
                        };
                        
                        document.addEventListener('click', startVideo);
                        document.addEventListener('touchstart', startVideo);
                        this.showMessage('📵 Tap screen to activate camera', 'warning');
                    });
                    
                    console.log('🎥 AR camera started successfully!');
                };
                
                // Add a test background to verify video element visibility
                setTimeout(() => {
                    if (videoElement.videoWidth === 0) {
                        console.warn('⚠️ Video dimensions are 0, adding test background');
                        videoElement.style.background = 'red';
                    }
                }, 2000);
                
            } else {
                throw new Error("Camera video element not found");
            }
            
        } catch (err) {
            console.error("❌ Camera setup failed:", err);
            
            // Handle specific permission errors
            if (err.name === 'NotAllowedError') {
                this.showMessage('📵 Camera permission denied. Please allow camera access for AR experience.', 'error');
            } else if (err.name === 'NotFoundError') {
                this.showMessage('📵 No camera found. Please ensure your device has a camera.', 'error');
            } else if (err.name === 'NotReadableError') {
                this.showMessage('📵 Camera is already in use by another application.', 'error');
            } else if (err.message.includes('HTTPS')) {
                this.showMessage('🔒 Camera requires HTTPS. Please run the app on a secure server (https://).', 'error');
            } else {
                this.showMessage(`📵 Camera error: ${err.message}`, 'error');
            }
            
            // Hide camera element on error
            const videoElement = document.getElementById("cam");
            if (videoElement) {
                videoElement.style.display = 'none';
            }
            
            // Show fallback message
            this.showMessage('🎮 Game running without AR camera. Use debug modal to spawn enemies.', 'warning');
        }
    }

    setupLocationTracking() {
        if (navigator.geolocation) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                pos => this.handleLocationUpdate(pos),
                err => {
                    console.log("Location access denied:", err);
                    // Don't make API calls if location fails
                    if (err.code === 3) { // Timeout expired
                        console.log("Location timeout - disabling location tracking");
                        this.showMessage('📍 Location timeout. Location features disabled.', 'warning');
                    } else if (err.code === 1) { // Permission denied
                        console.log("Location permission denied");
                        this.showMessage('📍 Location permission denied. Use debug modal to spawn enemies.', 'warning');
                    }
                    // Clear the watcher to prevent repeated failed calls
                    if (this.locationWatcher) {
                        navigator.geolocation.clearWatch(this.locationWatcher);
                        this.locationWatcher = null;
                    }
                },
                { 
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000  // Increased timeout to 10 seconds
                }
            );
        } else {
            console.log("Geolocation not available");
            this.showMessage('📍 Geolocation not supported on this device.', 'warning');
        }
    }

    disableLocationTracking() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
            this.locationWatcher = null;
        }
        this.showMessage('📍 Location tracking disabled due to repeated errors. Use debug modal to spawn enemies.', 'warning');
        console.log('🛑 Location tracking disabled due to repeated errors');
    }
    
    toggleTimeBasedSpawn() {
        const button = document.getElementById('timeBasedSpawnBtn');
        
        if (this.autoSpawnEnabled && this.autoSpawnMode === 'time-based') {
            // Disable time-based spawn
            this.autoSpawnEnabled = false;
            if (this.autoSpawnInterval) {
                clearInterval(this.autoSpawnInterval);
                this.autoSpawnInterval = null;
            }
            button.textContent = 'Time-Based Mode (15s)';
            button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            this.showMessage('🛑 Time-based auto-spawn disabled', 'info');
            console.log('🛑 Time-based auto-spawn disabled');
        } else {
            // Disable other modes first
            if (this.autoSpawnEnabled) {
                this.disableAllAutoSpawn();
            }
            
            // Enable time-based spawn
            this.autoSpawnEnabled = true;
            this.autoSpawnMode = 'time-based';
            this.autoSpawnTime = 15000; // 15 seconds
            button.textContent = 'Disable Time-Based';
            button.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            this.showMessage('🚀 Time-based auto-spawn enabled - enemies every 15 seconds', 'success');
            console.log('🚀 Time-based auto-spawn enabled (15s interval)');
            
            // Start spawning enemies
            this.startTimeBasedSpawning();
        }
    }
    
    toggleFastSpawn() {
        const button = document.getElementById('fastSpawnBtn');
        
        if (this.autoSpawnEnabled && this.autoSpawnMode === 'fast') {
            // Disable fast spawn
            this.autoSpawnEnabled = false;
            if (this.autoSpawnInterval) {
                clearInterval(this.autoSpawnInterval);
                this.autoSpawnInterval = null;
            }
            button.textContent = 'Fast Mode (5s)';
            button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            this.showMessage('🛑 Fast auto-spawn disabled', 'info');
            console.log('🛑 Fast auto-spawn disabled');
        } else {
            // Disable other modes first
            if (this.autoSpawnEnabled) {
                this.disableAllAutoSpawn();
            }
            
            // Enable fast spawn
            this.autoSpawnEnabled = true;
            this.autoSpawnMode = 'fast';
            this.autoSpawnTime = 5000; // 5 seconds
            button.textContent = 'Disable Fast Mode';
            button.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            this.showMessage('🚀 Fast auto-spawn enabled - enemies every 5 seconds', 'success');
            console.log('🚀 Fast auto-spawn enabled (5s interval)');
            
            // Start spawning enemies
            this.startTimeBasedSpawning();
        }
    }
    
    disableAllAutoSpawn() {
        // Disable location-based
        const locationBtn = document.getElementById('autoSpawnBtn');
        if (locationBtn) {
            locationBtn.textContent = 'Enable Auto Spawn';
            locationBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        }
        
        // Disable time-based
        const timeBtn = document.getElementById('timeBasedSpawnBtn');
        if (timeBtn) {
            timeBtn.textContent = 'Time-Based Mode (15s)';
            timeBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        }
        
        // Disable fast
        const fastBtn = document.getElementById('fastSpawnBtn');
        if (fastBtn) {
            fastBtn.textContent = 'Fast Mode (5s)';
            fastBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        }
        
        // Clear interval
        if (this.autoSpawnInterval) {
            clearInterval(this.autoSpawnInterval);
            this.autoSpawnInterval = null;
        }
        this.autoSpawnEnabled = false;
    }
    
    startTimeBasedSpawning() {
        if (!this.autoSpawnEnabled || this.autoSpawnMode === 'location') return;
        
        const spawnEnemy = () => {
            if (!this.autoSpawnEnabled || this.autoSpawnMode === 'location') return;
            
            // Only spawn if not in combat
            if (!this.gameState.inCombat) {
                // Use fetched SPAWN_CONFIG weights for proper enemy selection
                let enemyWeights;
                if (this.gameConfig.SPAWN_CONFIG && this.gameConfig.SPAWN_CONFIG.enemy_weights) {
                    enemyWeights = this.gameConfig.SPAWN_CONFIG.enemy_weights;
                } else {
                    // Fallback weights
                    enemyWeights = {
                        'class1': 0.5,  // 50% chance for Goblin
                        'class2': 0.3,  // 30% chance for Orc  
                        'class3': 0.2   // 20% chance for Dragon
                    };
                }
                
                // Select enemy based on weights
                const enemyTypes = Object.keys(enemyWeights);
                const weights = Object.values(enemyWeights);
                const randomIndex = this.weightedRandom(enemyTypes, weights);
                const randomEnemy = enemyTypes[randomIndex];
                
                this.spawnTestEnemy(randomEnemy);
                
                // Get enemy name for message
                const enemyNames = {
                    'class1': 'Goblin',
                    'class2': 'Orc', 
                    'class3': 'Dragon'
                };
                const modeName = this.autoSpawnMode === 'fast' ? 'Fast' : 'Time-based';
                console.log(`👹 ${modeName} auto-spawned: ${enemyNames[randomEnemy]} (config-based selection)`);
            }
            
            // Schedule next spawn
            const nextSpawnTime = this.autoSpawnTime;
            console.log(`⏰ Next enemy in ${nextSpawnTime / 1000} seconds (${this.autoSpawnMode} mode)`);
            
            this.autoSpawnInterval = setTimeout(spawnEnemy, nextSpawnTime);
        };
        
        // Start first spawn immediately
        spawnEnemy();
    }
    
    weightedRandom(items, weights) {
        // Calculate total weight
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // Generate random number between 0 and totalWeight
        let random = Math.random() * totalWeight;
        
        // Find the selected item based on weight
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        // Fallback to last item
        return items.length - 1;
    }
    
    toggleAutoSpawn() {
        const button = document.getElementById('autoSpawnBtn');
        
        if (this.autoSpawnEnabled && this.autoSpawnMode === 'location') {
            // Disable location-based auto-spawn
            this.autoSpawnEnabled = false;
            if (this.autoSpawnInterval) {
                clearInterval(this.autoSpawnInterval);
                this.autoSpawnInterval = null;
            }
            button.textContent = 'Enable Auto Spawn';
            button.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            this.showMessage('🛑 Location-based auto-spawn disabled', 'info');
            console.log('🛑 Location-based auto-spawn disabled');
        } else {
            // Disable other modes first
            if (this.autoSpawnEnabled) {
                this.disableAllAutoSpawn();
            }
            
            // Enable location-based auto-spawn
            this.autoSpawnEnabled = true;
            this.autoSpawnMode = 'location';
            button.textContent = 'Disable Auto Spawn';
            button.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            this.showMessage('🚀 Location-based auto-spawn enabled - enemies every 15-45 seconds', 'success');
            console.log('🚀 Location-based auto-spawn enabled');
            
            // Start spawning enemies
            this.startAutoSpawning();
        }
    }
    
    startAutoSpawning() {
        if (!this.autoSpawnEnabled) return;
        
        const spawnEnemy = () => {
            if (!this.autoSpawnEnabled) return;
            
            // Only spawn if not in combat
            if (!this.gameState.inCombat) {
                // Use SPAWN_CONFIG weights for proper enemy selection
                const enemyWeights = {
                    'class1': 0.5,  // 50% chance for Goblin
                    'class2': 0.3,  // 30% chance for Orc  
                    'class3': 0.2   // 20% chance for Dragon
                };
                
                // Select enemy based on weights
                const enemyTypes = Object.keys(enemyWeights);
                const weights = Object.values(enemyWeights);
                const randomIndex = this.weightedRandom(enemyTypes, weights);
                const randomEnemy = enemyTypes[randomIndex];
                
                this.spawnTestEnemy(randomEnemy);
                
                // Get enemy name for message
                const enemyNames = {
                    'class1': 'Goblin',
                    'class2': 'Orc', 
                    'class3': 'Dragon'
                };
                console.log(`👹 Location-based auto-spawned: ${enemyNames[randomEnemy]} (weight-based selection)`);
            }
            
            // Schedule next spawn with random interval (15-45 seconds)
            const nextSpawnTime = Math.random() * 30000 + 15000; // 15-45 seconds in milliseconds
            console.log(`⏰ Next enemy in ${Math.round(nextSpawnTime / 1000)} seconds (location-based mode)`);
            
            this.autoSpawnInterval = setTimeout(spawnEnemy, nextSpawnTime);
        };
        
        // Start first spawn immediately
        spawnEnemy();
    }

    setupThreeJS() {
        const container = document.getElementById('enemy-3d-container');
        if (!container) {
            console.error('❌ ERROR: enemy-3d-container not found');
            return;
        }

        console.log('🔧 DEBUG: Setting up Three.js scene');
        
        // Clean up existing Three.js if any
        if (this.threeRenderer) {
            this.threeRenderer.dispose();
            if (container.contains(this.threeRenderer.domElement)) {
                container.removeChild(this.threeRenderer.domElement);
            }
        }

        // Scene setup
        this.threeScene = new THREE.Scene();
        this.threeScene.background = null; // Transparent background

        // Camera setup - move enemies further from screen
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 600;
        this.threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000); // Standard FOV
        this.threeCamera.position.z = 20; // Move camera further back

        // Renderer setup with better transparency
        this.threeRenderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.threeRenderer.setSize(width, height);
        this.threeRenderer.setClearColor(0x000000, 0); // Fully transparent
        this.threeRenderer.shadowMap.enabled = true;
        this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.threeRenderer.toneMappingExposure = 1.2;
        
        // Enable depth testing for proper AR integration
        this.threeRenderer.sortObjects = false;
        container.appendChild(this.threeRenderer.domElement);

        // AR-style lighting that matches real environment
        this.setupARLighting();
        
        // Add ground plane for shadows and depth
        this.setupGroundPlane();

        console.log('✅ SUCCESS: Three.js setup complete');
        
        // Start render loop
        this.animate();
    }

    setupARLighting() {
        // Simple, reliable lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.threeScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.threeScene.add(directionalLight);
    }

    setupGroundPlane() {
        // Create invisible ground plane for shadows
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        const planeMaterial = new THREE.ShadowMaterial({ 
            opacity: 0.3,
            transparent: true
        });
        const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        groundPlane.rotation.x = -Math.PI / 2; // Rotate to be flat
        groundPlane.position.y = -5; // Position below enemy
        groundPlane.receiveShadow = true;
        this.threeScene.add(groundPlane);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.animationMixer) {
            this.animationMixer.update(0.016); // ~60fps
        }
        
        if (this.enemyModel) {
            // NO movement - keep enemy completely static
            // No floating, no breathing, no rotation
            // Enemy stays at fixed position
        }
        
        if (this.threeRenderer && this.threeScene && this.threeCamera) {
            this.threeRenderer.render(this.threeScene, this.threeCamera);
        }
    }

    async load3DEnemyModel(enemyType) {
        return new Promise((resolve, reject) => {
            console.log(`🔧 DEBUG: Attempting to load 3D model for ${enemyType}`);
            
            // Check if THREE and GLTFLoader are available
            if (typeof THREE === 'undefined') {
                console.error('❌ ERROR: THREE.js is not loaded');
                resolve(this.createFallbackEnemy(enemyType));
                return;
            }
            
            if (typeof THREE.GLTFLoader === 'undefined') {
                console.error('❌ ERROR: GLTFLoader is not available');
                resolve(this.createFallbackEnemy(enemyType));
                return;
            }
            
            const loader = new THREE.GLTFLoader();
            
            // Try to load 3D model, fallback to 2D image then to 3D shape
            const modelPath = `/static/assets/enemies/${enemyType}.glb`;
            console.log(`🔧 DEBUG: Loading model from ${modelPath}`);
            
            loader.load(
                modelPath,
                (gltf) => {
                    console.log(`✅ SUCCESS: 3D model loaded for ${enemyType}`, gltf);
                    const model = gltf.scene;
                    
                    // Set different scales for each enemy type
                    // Goblin < Dragon < Orc
                    let scale = 8; // default
                    if (enemyType === 'class1') {          // Goblin - smallest
                        scale = 6;
                    } else if (enemyType === 'class2') {   // Orc - biggest
                        scale = 12;
                    } else if (enemyType === 'class3') {   // Dragon - medium
                        scale = 9;
                    }
                    
                    model.scale.set(scale, scale, scale);
                    model.position.set(0, 0, 0);
                    
                    // Make all enemies face the camera (no 180° flip)
                    model.rotation.y = 0;
                    
                    model.castShadow = true;
                    model.receiveShadow = true;
                    
                    // Setup animations
                    if (gltf.animations.length > 0) {
                        console.log(`🎬 DEBUG: Found ${gltf.animations.length} animations`);
                        this.animationMixer = new THREE.AnimationMixer(model);
                        gltf.animations.forEach((clip) => {
                            const action = this.animationMixer.clipAction(clip);
                            action.play();
                        });
                    } else {
                        console.log(`🎬 DEBUG: No animations found`);
                    }
                    
                    resolve(model);
                },
                (progress) => {
                    console.log(`📊 DEBUG: Loading progress:`, progress);
                },
                (error) => {
                    console.warn(`⚠️ WARNING: Failed to load 3D model for ${enemyType}, trying 2D fallback:`, error);
                    // Try 2D image fallback first
                    this.load2DEnemyImage(enemyType).then(resolve).catch(() => {
                        resolve(this.createFallbackEnemy(enemyType));
                    });
                }
            );
        });
    }

    async load2DEnemyImage(enemyType) {
        return new Promise((resolve, reject) => {
            const imagePath = `/static/assets/enemies/${enemyType}.png`;
            console.log(`🔧 DEBUG: Trying 2D image fallback: ${imagePath}`);
            
            const loader = new THREE.TextureLoader();
            loader.load(
                imagePath,
                (texture) => {
                    console.log(`✅ SUCCESS: 2D image loaded for ${enemyType}`);
                    
                    // Set different sizes for each enemy type - make them much bigger
                    let size = 4; // default size increased
                    if (enemyType === 'class1') { // Goblin - small
                        size = 8;
                    } else if (enemyType === 'class2') { // Orc - big - much larger
                        size = 18;
                    } else if (enemyType === 'class3') { // Dragon - large
                        size = 15;
                    }
                    
                    // Create a plane geometry with the texture
                    const geometry = new THREE.PlaneGeometry(size, size);
                    const material = new THREE.MeshBasicMaterial({ 
                        map: texture,
                        transparent: true,
                        alphaTest: 0.1
                    });
                    const model = new THREE.Mesh(geometry, material);
                    model.castShadow = false;
                    model.receiveShadow = false;
                    
                    resolve(model);
                },
                undefined,
                (error) => {
                    console.warn(`⚠️ WARNING: Failed to load 2D image for ${enemyType}:`, error);
                    reject(error);
                }
            );
        });
    }

    createFallbackEnemy(enemyType) {
        // Create a simple 3D shape as fallback with appropriate sizes - make them much bigger
        let size = 4; // default size increased
        if (enemyType === 'class1') { // Goblin - small
            size = 3;
        } else if (enemyType === 'class2') { // Orc - big - much larger
            size = 6;
        } else if (enemyType === 'class3') { // Dragon - large
            size = 5;
        }
        
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.getEnemyColor(enemyType),
            emissive: this.getEnemyColor(enemyType),
            emissiveIntensity: 0.2
        });
        const model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        model.receiveShadow = true;
        return model;
    }

    getEnemyColor(enemyType) {
        const colors = {
            class1: 0x00ff00, // Green for Goblin
            class2: 0xff0000, // Red for Orc
            class3: 0x8b00ff   // Purple for Dragon
        };
        return colors[enemyType] || 0xffffff;
    }

    async handleLocationUpdate(position) {
        try {
            // Validate position data before making API call
            if (!position || !position.coords || 
                !position.coords.latitude || !position.coords.longitude ||
                position.coords.latitude === 0 || position.coords.longitude === 0) {
                console.warn('Invalid position data, skipping location update');
                return;
            }
            
            console.log('📍 Updating location:', position.coords.latitude, position.coords.longitude);
            
            const response = await fetch('/update-location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    player_id: this.gameState.playerId
                })
            });
            
            if (!response.ok) {
                this.locationErrorCount++;
                if (response.status === 500) {
                    console.error('❌ Server error in location update');
                    this.showMessage('🚫 Server error - location features temporarily disabled', 'error');
                } else {
                    console.error(`❌ Location update failed: ${response.status}`);
                    this.showMessage('🚫 Location tracking error', 'error');
                }
                
                // Disable location tracking after too many errors
                if (this.locationErrorCount >= this.maxLocationErrors) {
                    this.disableLocationTracking();
                }
                return;
            }
            
            // Reset error count on successful request
            this.locationErrorCount = 0;
            
            const data = await response.json();
            console.log('Location update response:', data);
            
            // Check if there's an error in the response
            if (data.error) {
                console.error('❌ Backend error:', data.error);
                this.showMessage(`🚫 Location error: ${data.error}`, 'error');
                return;
            }
            
            if (data.spawn) {
                console.log('Enemy spawned from location config!', data);
                this.gameState.enemy = data.enemy_stats;
                this.gameState.inCombat = true;
                this.showEnemy(data.enemy_stats);
                this.showMessage(`Enemy encountered: ${data.enemy}!`, 'success');
                this.spawnEnemy(data.enemy, data.enemy_stats);
            } else {
                console.log('No enemy spawned based on config, distance traveled:', data.distance_traveled);
                // Don't spawn locally - let config control everything
            }
        } catch (error) {
            console.error('Error updating location:', error);
            // Don't spawn locally if backend fails - let user use debug modal
            this.showMessage('Location tracking error. Use debug modal to spawn enemies.', 'error');
        }
    }

    async spawnEnemy(enemyType, enemyStats = null) {
        this.currentEnemy = enemyType;
        const enemyContainer = document.getElementById('enemy-container');
        const actionButtons = document.getElementById('actionButtons');
        
        // Clear previous enemy
        this.clearEnemy3D();
        
        // Use provided stats or default stats
        const stats = enemyStats || {
            hp: this.getDefaultEnemyHP(enemyType),
            max_hp: this.getDefaultEnemyHP(enemyType),
            atk: this.getDefaultEnemyATK(enemyType),
            name: this.getEnemyName(enemyType)
        };
        
        // AR spawn effect - fade in appearance
        this.showSpawnEffect();
        
        // Load 3D enemy model first
        this.enemyModel = await this.load3DEnemyModel(enemyType);
        if (this.enemyModel && this.threeScene) {
            // Center the enemy model in front of the camera
            // Slightly offset left so it's fully visible on most screens
            this.enemyModel.position.set(-1.0, 0, -8);
            
            // Add AR integration effects
            this.addAREffects(enemyType);
            
            this.threeScene.add(this.enemyModel);
            
            // Fade in animation
            this.fadeInEnemy();
        }
        
        // Update enemy info using existing elements
        document.getElementById('enemyName').textContent = stats.name;
        document.getElementById('enemyStats').textContent = `HP: ${stats.hp}/${stats.max_hp}`;
        
        // Update enemy health bar
        const healthPercent = (stats.hp / stats.max_hp) * 100;
        document.getElementById('enemyHealthFill').style.width = healthPercent + '%';
        
        // Show enemy container and action buttons
        enemyContainer.style.display = 'block';
        actionButtons.classList.add('show');
        this.showMessage(`⚔️ ${stats.name} appeared!`, 'success');
        
        // Update game state
        this.gameState.enemy = stats;
        this.gameState.inCombat = true;
        
        // Start idle animation
        this.playEnemyAnimation('idle');
        
        console.log(`👹 Enemy spawned: ${enemyType} with ${stats.hp} HP`);
    }

    getEnemyIcon(enemyType) {
        const icons = {
            'class1': '👹',
            'class2': '👺', 
            'class3': '🐉',
            'goblin': '👹',
            'orc': '👺',
            'dragon': '🐉'
        };
        return icons[enemyType] || '👾';
    }

    showSpawnEffect() {
        // Visual spawn effect
        const container = document.getElementById('enemy-3d-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transition = 'opacity 1.5s ease-in';
            setTimeout(() => {
                container.style.opacity = '1';
            }, 100);
        }
    }

    fadeInEnemy() {
        if (this.enemyModel) {
            this.enemyModel.traverse((child) => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0;
                    const fadeIn = () => {
                        if (child.material.opacity < 1) {
                            child.material.opacity += 0.02;
                            requestAnimationFrame(fadeIn);
                        }
                    };
                    fadeIn();
                }
            });
        }
    }

    addAREffects(enemyType) {
        if (!this.enemyModel) return;
        
        // Add environment-based material properties
        this.enemyModel.traverse((child) => {
            if (child.isMesh) {
                // Enable proper depth testing
                child.material.depthTest = true;
                child.material.depthWrite = true;
                
                // Add subtle environment reflection
                if (child.material.metalness !== undefined) {
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.8;
                }
                
                // Enable shadows
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Add particle effects for more AR feel
        this.addSpawnParticles(enemyType);
    }

    addSpawnParticles(enemyType) {
        // Create simple particle effect for spawn
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: this.getEnemyColor(enemyType),
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position around enemy
            particle.position.x = (Math.random() - 0.5) * 10;
            particle.position.y = Math.random() * 5;
            particle.position.z = (Math.random() - 0.5) * 10;
            
            this.threeScene.add(particle);
            particles.push(particle);
        }
        
        // Animate particles and remove after spawn
        let particleLife = 100;
        const animateParticles = () => {
            if (particleLife > 0) {
                particles.forEach(particle => {
                    particle.position.y += 0.1;
                    particle.material.opacity -= 0.006;
                });
                particleLife--;
                requestAnimationFrame(animateParticles);
            } else {
                // Remove particles
                particles.forEach(particle => {
                    this.threeScene.remove(particle);
                });
            }
        };
        animateParticles();
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
        if (this.gameConfig.ENEMY_STATS && this.gameConfig.ENEMY_STATS[enemyType]) {
            return this.gameConfig.ENEMY_STATS[enemyType].name;
        }
        // Fallback
        const names = {
            class1: 'Goblin',
            class2: 'Orc',
            class3: 'Dragon'
        };
        return names[enemyType] || 'Monster';
    }

    getDefaultEnemyHP(enemyType) {
        if (this.gameConfig.ENEMY_STATS && this.gameConfig.ENEMY_STATS[enemyType]) {
            return this.gameConfig.ENEMY_STATS[enemyType].hp;
        }
        // Fallback
        const hp = {
            class1: 30,
            class2: 50,
            class3: 100
        };
        return hp[enemyType] || 30;
    }

    getDefaultEnemyATK(enemyType) {
        if (this.gameConfig.ENEMY_STATS && this.gameConfig.ENEMY_STATS[enemyType]) {
            return this.gameConfig.ENEMY_STATS[enemyType].atk;
        }
        // Fallback
        const atk = {
            class1: 5,
            class2: 10,
            class3: 15
        };
        return atk[enemyType] || 5;
    }
    
    getEnemyXPReward(enemyType) {
        if (this.gameConfig.ENEMY_STATS && this.gameConfig.ENEMY_STATS[enemyType]) {
            return this.gameConfig.ENEMY_STATS[enemyType].xp_reward;
        }
        // Fallback
        const xp = {
            class1: 10,
            class2: 25,
            class3: 50
        };
        return xp[enemyType] || 10;
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
        this.clearEnemy3D();

        const enemyContainer = document.getElementById('enemy-container');
        const actionButtons = document.getElementById('actionButtons');

        if (enemyContainer) {
            enemyContainer.style.display = 'none';
        }
        if (actionButtons) {
            actionButtons.classList.remove('show');
        }

        this.gameState.enemy = null;
        this.gameState.inCombat = false;
        this.showMessage('📍 Move around to find enemies...', 'info');
    }

    clearEnemy3D() {
        if (this.enemyModel && this.threeScene) {
            this.threeScene.remove(this.enemyModel);
            this.enemyModel = null;
        }
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
            this.animationMixer = null;
        }
    }

    async loadLeaderboardData() {
        try {
            const response = await fetch('/leaderboard');
            const data = await response.json();
            this.updatePlayerStats(data);
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }

    updatePlayerStats(data) {
        const levelEl = document.getElementById('level');
        const xpEl = document.getElementById('xp');

        if (levelEl) levelEl.textContent = data.level ?? 1;
        if (xpEl) xpEl.textContent = data.xp ?? 0;
        
        if (data.current_hp !== undefined && data.max_hp !== undefined) {
            const hpPercent = (data.current_hp / data.max_hp) * 100;
            const hpFill = document.getElementById('playerHpFill');
            const hpText = document.getElementById('playerHpText');

            if (hpFill) {
                hpFill.style.width = hpPercent + '%';
            }
            if (hpText) {
                hpText.textContent = `HP: ${data.current_hp}/${data.max_hp}`;
            }
        }
        
        this.playerData = data;
    }

    getXPForEnemy(enemyType) {
        const xpValues = { class1: 10, class2: 25, class3: 50 };
        return xpValues[enemyType] || 10;
    }

    async testAssetLoading() {
        console.log('🔧 DEBUG: Testing asset loading...');
        
        try {
            // Test if assets endpoint works
            const response = await fetch('/test-assets');
            const data = await response.json();
            console.log('📁 Asset files found:', data);
            
            // Test direct file access
            const testUrls = [
                '/static/assets/enemies/class1.glb',
                '/static/assets/enemies/class2.glb', 
                '/static/assets/enemies/class3.glb',
                '/static/assets/enemies/class1.png',
                '/static/assets/enemies/class2.png',
                '/static/assets/enemies/class3.png'
            ];
            
            for (const url of testUrls) {
                try {
                    const imgResponse = await fetch(url, { method: 'HEAD' });
                    console.log(`🔍 ${url}: ${imgResponse.status} ${imgResponse.ok ? '✅' : '❌'}`);
                } catch (e) {
                    console.log(`🔍 ${url}: ❌ Error - ${e.message}`);
                }
            }
        } catch (error) {
            console.error('❌ Error testing assets:', error);
        }
    }

    async spawnTestEnemy(enemyType = 'class3') {
        // Use provided enemy type or default to class3 for backward compatibility
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
        const enemyIcons = {
            'class1': '👹',
            'class2': '👺',
            'class3': '🐉'
        };
        gameLog.innerHTML = `
            <div class="log-entry debug">
                ${enemyIcons[enemyType]} DEBUG: Test enemy spawned! (${enemyStats.name} - HP: ${enemyStats.hp}/${enemyStats.max_hp})
            </div>
        ` + gameLog.innerHTML;
    }

    async spawnGoblin() {
        const enemyType = 'class1';
        const enemyStats = {
            hp: this.getDefaultEnemyHP(enemyType),
            max_hp: this.getDefaultEnemyHP(enemyType),
            atk: this.getDefaultEnemyATK(enemyType),
            name: this.getEnemyName(enemyType)
        };
        
        console.log(`👹 DEBUG: Spawning Goblin - HP: ${enemyStats.hp}/${enemyStats.max_hp}`);
        this.spawnEnemy(enemyType, enemyStats);
    }

    async spawnOrc() {
        const enemyType = 'class2';
        const enemyStats = {
            hp: this.getDefaultEnemyHP(enemyType),
            max_hp: this.getDefaultEnemyHP(enemyType),
            atk: this.getDefaultEnemyATK(enemyType),
            name: this.getEnemyName(enemyType)
        };
        
        console.log(`👺 DEBUG: Spawning Orc - HP: ${enemyStats.hp}/${enemyStats.max_hp}`);
        this.spawnEnemy(enemyType, enemyStats);
    }

    toggleDebugModal() {
        const modal = document.getElementById('debugModal');
        if (modal.style.display === 'none') {
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'none';
        }
    }

    async forceLocationUpdate() {
        // Simulate a location update with some movement
        const mockPosition = {
            coords: {
                latitude: 37.7749 + (Math.random() - 0.5) * 0.01, // Random lat around San Francisco
                longitude: -122.4194 + (Math.random() - 0.5) * 0.01 // Random lon around San Francisco
            }
        };
        
        this.showMessage('🔄 Forcing location update...', 'success');
        await this.handleLocationUpdate(mockPosition);
    }

    async playerAttack() {
        if (!this.gameState.inCombat) {
            this.showMessage('No enemy to attack!', 'error');
            return;
        }
        
        if (!this.gameState.characterClass) {
            this.showMessage('No character selected!', 'error');
            return;
        }
        
        // Disable buttons during combat turn
        this.disableCombatButtons(true);
        
        try {
            const response = await fetch('/combat-turn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_id: this.gameState.playerId,
                    action: 'attack'
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.showMessage(data.error, 'error');
                this.disableCombatButtons(false);
                return;
            }
            
            // Display combat messages
            if (data.combat_messages && data.combat_messages.length > 0) {
                data.combat_messages.forEach(msg => this.showMessage(msg, 'success'));
            }
            
            // Handle combat results
            this.handleCombatTurnResult(data);
            
        } catch (error) {
            console.error('Attack error:', error);
            this.showMessage('Attack failed', 'error');
            this.disableCombatButtons(false);
        }
    }

    async useSkill() {
        if (!this.gameState.inCombat) {
            this.showMessage('No enemy to use skill on!', 'error');
            return;
        }
        
        if (!this.gameState.characterClass) {
            this.showMessage('No character selected!', 'error');
            return;
        }
        
        const abilities = this.characterAbilities[this.gameState.characterClass];
        const skillName = abilities.skill;
        
        // Disable buttons during combat turn
        this.disableCombatButtons(true);
        
        try {
            const response = await fetch('/combat-turn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_id: this.gameState.playerId,
                    action: 'skill',
                    skill_name: skillName
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.showMessage(data.error, 'error');
                this.disableCombatButtons(false);
                return;
            }
            
            // Display combat messages
            if (data.combat_messages && data.combat_messages.length > 0) {
                data.combat_messages.forEach(msg => this.showMessage(msg, 'success'));
            }
            
            // Handle combat results
            this.handleCombatTurnResult(data);
            
        } catch (error) {
            console.error('Skill error:', error);
            this.showMessage('Skill failed', 'error');
            this.disableCombatButtons(false);
        }
    }

    async heal() {
        if (!this.gameState.characterClass) {
            this.showMessage('No character selected!', 'error');
            return;
        }
        
        const abilities = this.characterAbilities[this.gameState.characterClass];
        const skillName = abilities.heal;
        
        // Disable buttons during combat turn
        this.disableCombatButtons(true);
        
        try {
            const response = await fetch('/combat-turn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    player_id: this.gameState.playerId,
                    action: 'skill',
                    skill_name: skillName
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                this.showMessage(data.error, 'error');
                this.disableCombatButtons(false);
                return;
            }
            
            // Display combat messages
            if (data.combat_messages && data.combat_messages.length > 0) {
                data.combat_messages.forEach(msg => this.showMessage(msg, 'success'));
            }
            
            // Handle combat results
            this.handleCombatTurnResult(data);
            
        } catch (error) {
            console.error('Heal error:', error);
            this.showMessage('Heal failed', 'error');
            this.disableCombatButtons(false);
        }
    }

    handleCombatTurnResult(data) {
        // Update enemy health if we got enemy_hp back (player dealt damage)
        if (this.gameState.enemy && typeof data.enemy_hp === 'number') {
            this.gameState.enemy.hp = data.enemy_hp;
            this.updateEnemyHealth();
            // Play enemy hit animation
            this.playEnemyAnimation('hit');
        }
        
        // Update player health if enemy attacked
        if (data.enemy_attack && data.enemy_attack.damage !== undefined && typeof data.player_hp === 'number') {
            this.gameState.player.current_hp = data.player_hp;
            this.updateStats();
            
            // Play enemy attack animation
            this.playEnemyAnimation('attack');
            
            // Screen shake effect for enemy attack
            this.screenShake();
        }
        
        // Handle enemy defeat
        if (data.enemy_defeated) {
            // Play enemy defeat animation
            this.playEnemyAnimation('defeat');
            
            setTimeout(() => {
                this.gameState.enemy = null;
                this.gameState.inCombat = false;
                document.getElementById('enemy-container').style.display = 'none';
                document.getElementById('actionButtons').classList.remove('show');
                
                if (data.xp_gained) {
                    this.showMessage(`Enemy defeated! +${data.xp_gained} XP`, 'success');
                }
                
                if (data.leveled_up) {
                    this.showMessage(`LEVEL UP! You are now level ${data.new_level}!`, 'success');
                }
                
                this.updateStats();
                this.disableCombatButtons(false);
            }, 1000); // Wait for defeat animation
            return;
        }
        
        // Handle player defeat
        if (data.player_defeated) {
            this.showMessage('You have been defeated!', 'error');
            this.gameState.inCombat = false;
            this.disableCombatButtons(false);
            document.getElementById('enemy-container').style.display = 'none';
            document.getElementById('actionButtons').classList.remove('show');
            
            // Play player defeat effect
            this.playDefeatEffect();
            
            setTimeout(() => {
                window.router.navigate('/');
            }, 3000);
            return;
        }
        
        // Re-enable combat buttons if combat is still active
        if (this.gameState.inCombat && !data.enemy_defeated && !data.player_defeated) {
            this.disableCombatButtons(false);
        }
    }

    playEnemyAnimation(animationType) {
        if (!this.enemyModel || !this.threeScene) return;
        
        switch(animationType) {
            case 'attack':
                this.enemyAttackAnimation();
                break;
            case 'hit':
                this.enemyHitAnimation();
                break;
            case 'defeat':
                this.enemyDefeatAnimation();
                break;
            case 'idle':
                this.enemyIdleAnimation();
                break;
        }
    }

    enemyAttackAnimation() {
        // Enemy attacks - lunge forward and back
        const originalPosition = this.enemyModel.position.clone();
        const originalRotation = this.enemyModel.rotation.clone();
        
        // Lunge forward
        const attackDuration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / attackDuration, 1);
            
            if (progress < 0.5) {
                // Lunge forward
                const lungeProgress = progress * 2;
                this.enemyModel.position.z = originalPosition.z - (lungeProgress * 3);
                this.enemyModel.position.y = originalPosition.y + Math.sin(lungeProgress * Math.PI) * 0.5;
                this.enemyModel.rotation.y = originalRotation.y + Math.sin(lungeProgress * Math.PI) * 0.2;
            } else {
                // Return to original position
                const returnProgress = (progress - 0.5) * 2;
                this.enemyModel.position.lerp(originalPosition, returnProgress);
                this.enemyModel.rotation.y = originalRotation.y + Math.sin(returnProgress * Math.PI) * 0.1 * (1 - returnProgress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.enemyModel.position.copy(originalPosition);
                this.enemyModel.rotation.copy(originalRotation);
            }
        };
        
        animate();
    }

    enemyHitAnimation() {
        // Enemy gets hit - shake and flash red
        const originalPosition = this.enemyModel.position.clone();
        const shakeIntensity = 0.3;
        const shakeDuration = 300;
        const startTime = Date.now();
        
        // Flash red effect
        if (this.enemyModel.children.length > 0) {
            this.enemyModel.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.material.color.setHex(0xff0000);
                }
            });
        }
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shakeDuration, 1);
            
            if (progress < 1) {
                // Shake effect
                const shakeX = (Math.random() - 0.5) * shakeIntensity * (1 - progress);
                const shakeY = (Math.random() - 0.5) * shakeIntensity * (1 - progress);
                this.enemyModel.position.x = originalPosition.x + shakeX;
                this.enemyModel.position.y = originalPosition.y + shakeY;
                
                requestAnimationFrame(animate);
            } else {
                this.enemyModel.position.copy(originalPosition);
                
                // Restore original color
                if (this.enemyModel.children.length > 0) {
                    this.enemyModel.traverse((child) => {
                        if (child.isMesh && child.material.color.getHex() === 0xff0000) {
                            child.material.color.setHex(0xffffff);
                        }
                    });
                }
            }
        };
        
        animate();
    }

    enemyDefeatAnimation() {
        // Enemy defeated - fall down and fade out
        const fallDuration = 1000;
        const startTime = Date.now();
        const originalPosition = this.enemyModel.position.clone();
        const originalRotation = this.enemyModel.rotation.clone();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / fallDuration, 1);
            
            // Fall down
            this.enemyModel.position.y = originalPosition.y - (progress * progress * 5);
            
            // Spin while falling
            this.enemyModel.rotation.x = originalRotation.x + (progress * Math.PI * 2);
            this.enemyModel.rotation.z = originalRotation.z + (progress * Math.PI);
            
            // Fade out
            if (this.enemyModel.children.length > 0) {
                this.enemyModel.traverse((child) => {
                    if (child.isMesh) {
                        child.material.opacity = 1 - progress;
                        child.material.transparent = true;
                    }
                });
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove enemy from scene
                if (this.threeScene && this.enemyModel) {
                    this.threeScene.remove(this.enemyModel);
                }
            }
        };
        
        animate();
    }

    enemyIdleAnimation() {
        // Enemy idle breathing animation
        if (!this.idleAnimationRunning) {
            this.idleAnimationRunning = true;
            const breathe = () => {
                if (!this.enemyModel || !this.gameState.inCombat) {
                    this.idleAnimationRunning = false;
                    return;
                }
                
                const time = Date.now() * 0.001;
                this.enemyModel.position.y = Math.sin(time * 2) * 0.1;
                this.enemyModel.rotation.y = Math.sin(time * 0.5) * 0.05;
                
                requestAnimationFrame(breathe);
            };
            breathe();
        }
    }

    screenShake() {
        // Screen shake effect when enemy attacks
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        const originalTransform = gameContainer.style.transform || '';
        const shakeIntensity = 5;
        const shakeDuration = 200;
        const startTime = Date.now();
        
        const shake = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / shakeDuration, 1);
            
            if (progress < 1) {
                const shakeX = (Math.random() - 0.5) * shakeIntensity * (1 - progress);
                const shakeY = (Math.random() - 0.5) * shakeIntensity * (1 - progress);
                gameContainer.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
                
                requestAnimationFrame(shake);
            } else {
                gameContainer.style.transform = originalTransform;
            }
        };
        
        shake();
    }

    playDefeatEffect() {
        // Player defeat effect - red flash and fade
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        gameContainer.style.transition = 'filter 0.5s ease';
        gameContainer.style.filter = 'brightness(2) saturate(0) hue-rotate(-50deg)';
        
        setTimeout(() => {
            gameContainer.style.filter = 'brightness(0.3) saturate(0)';
        }, 500);
    }

    disableCombatButtons(disabled) {
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    async escape() {
        if (!this.gameState.inCombat) {
            this.showMessage('No combat to escape from!', 'error');
            return;
        }
        
        this.gameState.enemy = null;
        this.gameState.inCombat = false;
        document.getElementById('enemy-container').style.display = 'none';
        document.getElementById('actionButtons').classList.remove('show');
        this.showMessage('Escaped from combat!', 'success');
    }

    // Helper Methods
    showMessage(text, type = 'info') {
        const messageArea = document.getElementById('messageArea');
        messageArea.innerHTML = `<div class="message ${type}">${text}</div>`;
        
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 3000);
    }

    updateStats() {
        if (!this.gameState.player) return;
        
        const hpPercent = (this.gameState.player.current_hp / this.gameState.player.max_hp) * 100;
        const playerHpFill = document.getElementById('playerHpFill');
        const playerHpText = document.getElementById('playerHpText');
        
        if (playerHpFill) playerHpFill.style.width = hpPercent + '%';
        if (playerHpText) playerHpText.textContent = 
            `${this.gameState.player.current_hp}/${this.gameState.player.max_hp}`;
        
        const levelElement = document.getElementById('level');
        const xpElement = document.getElementById('xp');
        
        if (levelElement) levelElement.textContent = this.gameState.player.level;
        if (xpElement) xpElement.textContent = this.gameState.player.xp;
    }

    updateEnemyHealth() {
        if (!this.gameState.enemy) return;
        
        const healthPercent = (this.gameState.enemy.hp / this.gameState.enemy.max_hp) * 100;
        document.getElementById('enemyHealthFill').style.width = healthPercent + '%';
        document.getElementById('enemyStats').textContent = 
            `HP: ${this.gameState.enemy.hp}/${this.gameState.enemy.max_hp}`;
    }

    showEnemy(enemy) {
        const enemyContainer = document.getElementById('enemy-container');
        const actionButtons = document.getElementById('actionButtons');
        
        if (enemyContainer) {
            enemyContainer.style.display = 'block';
        }
        if (actionButtons) {
            actionButtons.classList.add('show');
        }

        const nameEl = document.getElementById('enemyName');
        if (nameEl) {
            nameEl.textContent = enemy.name;
        }
        
        this.updateEnemyHealth();
    }

    updateAbilityButtons() {
        if (!this.gameState.characterClass) return;
        
        const abilities = this.characterAbilities[this.gameState.characterClass];
        document.getElementById('attackBtn').textContent = abilities.attack;
        document.getElementById('skillBtn').textContent = abilities.skill;
        document.getElementById('healBtn').textContent = abilities.heal;
    }

    cleanup() {
        // Remove scroll prevention class
        document.body.classList.remove('game-page-body');
        
        // Clear location watcher
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
        }
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Clear auto-spawn
        if (this.autoSpawnInterval) {
            clearInterval(this.autoSpawnInterval);
            this.autoSpawnInterval = null;
        }
        this.autoSpawnEnabled = false;
        
        // Cleanup Three.js resources
        if (this.enemyModel) {
            this.threeScene.remove(this.enemyModel);
            this.enemyModel = null;
        }
        if (this.animationMixer) {
            this.animationMixer.stopAllAction();
            this.animationMixer = null;
        }
        if (this.threeRenderer) {
            this.threeRenderer.dispose();
            const container = document.getElementById('enemy-3d-container');
            if (container && this.threeRenderer.domElement) {
                container.removeChild(this.threeRenderer.domElement);
            }
            this.threeRenderer = null;
        }
        this.threeScene = null;
        this.threeCamera = null;
    }
}
