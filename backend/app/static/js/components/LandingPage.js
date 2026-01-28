// Landing Page Component
class LandingPage {
    constructor() {
        this.leaderboardData = [];
    }

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="landing-container">
                <div class="logo-container">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 900 220"
                      width="100%"
                      height="auto"
                      class="game-logo"
                    >
                      <defs>
                        <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stop-color="#f9dc8f"/>
                          <stop offset="35%" stop-color="#e1b64b"/>
                          <stop offset="36%" stop-color="#2a62c9"/>
                          <stop offset="100%" stop-color="#123a7a"/>
                        </linearGradient>
                        <linearGradient id="shineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
                          <stop offset="50%" stop-color="rgba(255,255,255,0.6)"/>
                          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                        </linearGradient>
                        <filter id="shadow">
                          <feDropShadow dx="6" dy="6" stdDeviation="4" flood-color="#0b2f66"/>
                        </filter>
                        <style>
                          .float { animation: float 4s ease-in-out infinite; }
                          @keyframes float {
                            0%,100% { transform: translateY(0); }
                            50% { transform: translateY(-6px); }
                          }
                          .shine { animation: shine 3s linear infinite; }
                          @keyframes shine {
                            from { transform: translateX(-300px); }
                            to { transform: translateX(300px); }
                          }
                        </style>
                      </defs>
                      <g class="float" filter="url(#shadow)">
                        <text x="80" y="150"
                          font-size="120"
                          font-weight="900"
                          font-family="Impact, Arial Black, sans-serif"
                          fill="url(#textGradient)"
                          stroke="#caa24a"
                          stroke-width="4"
                          transform="skewX(-8)">
                          KLA
                        </text>
                        <text x="430" y="150"
                          font-size="120"
                          font-weight="900"
                          font-family="Impact, Arial Black, sans-serif"
                          fill="url(#textGradient)"
                          stroke="#caa24a"
                          stroke-width="4"
                          transform="skewX(8)">
                          SICK
                        </text>
                      </g>
                      <rect x="-300" y="40" width="300" height="160"
                        fill="url(#shineGradient)"
                        class="shine"
                        opacity="0.6"/>
                    </svg>
                </div>
                
                <div class="game-description">
                    <p>🎮 WebAR RPG Adventure</p>
                    <p>🗺️ Explore your real world</p>
                    <p>⚔️ Battle epic enemies</p>
                    <p>🏆 Level up your hero</p>
                </div>
                
                <div class="main-actions">
                    <button class="btn-start" onclick="window.router.navigate('/character')">Start Adventure</button>
                    <button class="btn-leaderboard" onclick="window.router.navigate('/leaderboard')">Leaderboard</button>
                    </div>
                </div>
            </div>
        `;

        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/leaderboard');
            const data = await response.json();
            this.displayLeaderboard(data);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            document.getElementById('leaderboard-list').innerHTML = 
                '<div class="error">Failed to load leaderboard</div>';
        }
    }

    displayLeaderboard(data) {
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (!data || !data.kills) {
            leaderboardList.innerHTML = '<div class="no-data">No players yet</div>';
            return;
        }

        // Create leaderboard entries
        const enemies = ['class1', 'class2', 'class3'];
        const enemyNames = { class1: 'Goblins', class2: 'Orcs', class3: 'Dragons' };
        const enemyIcons = { class1: '👹', class2: '👺', class3: '🐉' };
        
        let leaderboardHTML = '';
        
        enemies.forEach(enemyType => {
            const kills = data.kills[enemyType] || 0;
            if (kills > 0) {
                leaderboardHTML += `
                    <div class="leaderboard-entry">
                        <div class="rank-icon">${enemyIcons[enemyType]}</div>
                        <div class="enemy-info">
                            <span class="enemy-name">${enemyNames[enemyType]}</span>
                            <span class="kill-count">${kills} defeated</span>
                        </div>
                    </div>
                `;
            }
        });

        if (leaderboardHTML === '') {
            leaderboardHTML = '<div class="no-data">No enemies defeated yet</div>';
        }

        // Add player stats
        leaderboardHTML = `
            <div class="player-stats-summary">
                <div class="stat-item">
                    <span class="stat-label">Level</span>
                    <span class="stat-value">${data.level || 1}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">XP</span>
                    <span class="stat-value">${data.xp || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Kills</span>
                    <span class="stat-value">${(data.kills.class1 || 0) + (data.kills.class2 || 0) + (data.kills.class3 || 0)}</span>
                </div>
            </div>
        ` + leaderboardHTML;

        leaderboardList.innerHTML = leaderboardHTML;
    }

    toggleLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        const isVisible = container.style.display !== 'none';
        
        container.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Load fresh data when opening
            this.loadLeaderboard();
        }
    }

    cleanup() {
        // No cleanup needed for landing page
    }
}
