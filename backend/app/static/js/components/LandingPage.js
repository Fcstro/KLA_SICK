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
                    <span class="word left">KLA</span>
                    <span class="word right">SICK</span>
                </div>
                
                <div class="game-description">
                    <h2>WebAR RPG Adventure</h2>
                    <p>Battle enemies in augmented reality!</p>
                </div>

                <div class="main-actions">
                    <button class="btn-start" onclick="router.navigate('/character')">
                        🎮 Start Adventure
                    </button>
                    <button class="btn-leaderboard" onclick="landingPage.toggleLeaderboard()">
                        🏆 View Leaderboard
                    </button>
                </div>

                <div id="leaderboard-container" class="leaderboard-container" style="display: none;">
                    <h3>🏆 Top Players</h3>
                    <div id="leaderboard-list" class="leaderboard-list">
                        <div class="loading">Loading leaderboard...</div>
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
