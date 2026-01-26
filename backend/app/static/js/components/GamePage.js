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
                        <div id="enemy-container" class="enemy-container">
                            <div id="enemy-3d-container" class="enemy-3d-container"></div>
                        </div>
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
                        <button class="btn-debug" onclick="gamePage.testAssetLoading()">🔍 Test Assets</button>
                        <button class="btn-debug" onclick="gamePage.spawnGoblin()">👹 Spawn Goblin</button>
                        <button class="btn-debug" onclick="gamePage.spawnOrc()">👺 Spawn Orc</button>
                        <button class="btn-debug" onclick="gamePage.spawnTestEnemy()">🐉 Spawn Dragon</button>
                    </div>
                </div>
            </div>
        `;

        this.initializeGame();
    }

    async initializeGame() {
        await this.setupCamera();
        this.setupLocationTracking();
        this.setupThreeJS();
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

        // Camera setup - adjust for responsive canvas
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 600;
        this.threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000); // Standard FOV
        this.threeCamera.position.z = 8; // Standard camera distance

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
                    
                    // Set different scales for each enemy type - make them HUGE
                    let scale = 8; // default scale massively increased
                    if (enemyType === 'class1') { // Goblin - small
                        scale = 6;
                    } else if (enemyType === 'class2') { // Orc - big - MASSIVE
                        scale = 12;
                    } else if (enemyType === 'class3') { // Dragon - large
                        scale = 10;
                    }
                    
                    model.scale.set(scale, scale, scale);
                    model.position.set(0, 0, 0);
                    
                    // Fix model orientation - different rotation for each enemy type
                    if (enemyType === 'class2') { // Orc - needs different rotation
                        model.rotation.y = 0; // No rotation needed for Orc
                    } else {
                        model.rotation.y = Math.PI; // 180 degrees for Goblin and Dragon
                    }
                    
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
                        size = 3;
                    } else if (enemyType === 'class2') { // Orc - big - much larger
                        size = 6;
                    } else if (enemyType === 'class3') { // Dragon - large
                        size = 5;
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

    async spawnEnemy(enemyType, enemyStats = null) {
        this.currentEnemy = enemyType;
        const enemyContainer = document.getElementById('enemy-container');
        const combatControls = document.getElementById('combat-controls');
        const statusMessage = document.getElementById('status-message');
        
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
            // Position enemy to look like it's standing on real ground
            this.enemyModel.position.y = 0; // Ground level
            this.enemyModel.position.set(0, 0, 0);
            
            // Add AR integration effects
            this.addAREffects(enemyType);
            
            this.threeScene.add(this.enemyModel);
            
            // Fade in animation
            this.fadeInEnemy();
        }
        
        // Update enemy info without destroying the 3D container
        const enemyInfo = enemyContainer.querySelector('.enemy-info') || document.createElement('div');
        enemyInfo.className = 'enemy-info';
        enemyInfo.innerHTML = `
            <h3>${stats.name}</h3>
            <div class="health-bar-container">
                <div class="health-bar enemy-health-bar">
                    <div class="health-fill enemy-health-fill" style="width: 100%"></div>
                </div>
                <span class="health-text enemy-health-text">HP: ${stats.hp}/${stats.max_hp}</span>
            </div>
            <p>Wild enemy appeared!</p>
        `;
        
        // Make sure enemy container has the right structure
        if (!enemyContainer.querySelector('.enemy-visual')) {
            enemyContainer.innerHTML = `
                <div class="enemy ${enemyType}">
                    <div class="enemy-visual">
                        <div id="enemy-3d-container" class="enemy-3d-container"></div>
                        <div class="enemy-icon-fallback" style="display: none;">${this.getEnemyIcon(enemyType)}</div>
                    </div>
                </div>
            `;
            // Re-setup Three.js container since we replaced innerHTML
            this.setupThreeJS();
            // Re-add the enemy model
            if (this.enemyModel && this.threeScene) {
                this.threeScene.add(this.enemyModel);
            }
        }
        
        // Add the enemy info
        enemyContainer.querySelector('.enemy').appendChild(enemyInfo);
        
        combatControls.style.display = 'flex';
        statusMessage.textContent = `⚔️ A ${stats.name} appeared!`;
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
        this.clearEnemy3D();
        document.getElementById('enemy-container').innerHTML = `
            <div id="enemy-3d-container" class="enemy-3d-container"></div>
        `;
        document.getElementById('combat-controls').style.display = 'none';
        document.getElementById('status-message').textContent = '📍 Move around to find enemies...';
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

    async spawnTestEnemy() {
        // For testing - spawn class3 enemy (Dragon)
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

    cleanup() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
        }
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Cleanup Three.js resources
        this.clearEnemy3D();
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
