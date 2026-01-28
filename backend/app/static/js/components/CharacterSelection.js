// Character Selection Component
class CharacterSelection {
    constructor() {
        this.characters = {
            warrior: { name: "Warrior", hp: 120, atk: 15, description: "High health, balanced damage" },
            mage: { name: "Mage", hp: 80, atk: 25, description: "Low health, high damage" },
            archer: { name: "Archer", hp: 100, atk: 18, description: "Balanced stats" },
            healer: { name: "Healer", hp: 110, atk: 12, description: "High health, support role" },
            rogue: { name: "Rogue", hp: 90, atk: 20, description: "Medium health, high damage" }
        };
        this.selectedCharacter = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="character-selection">
                <div class="header">
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
                    <h2>Choose Your Hero</h2>
                </div>
                
                <div class="characters-grid">
                    ${Object.entries(this.characters).map(([key, char]) => `
                        <div class="character-card ${this.selectedCharacter === key ? 'selected' : ''}" 
                             onclick="window.characterSelection.selectCharacter('${key}')">
                            <div class="character-icon">${this.getCharacterIcon(key)}</div>
                            <h3>${char.name}</h3>
                            <div class="stats">
                                <div class="stat">
                                    <span class="stat-label">HP:</span>
                                    <span class="stat-value">${char.hp}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">ATK:</span>
                                    <span class="stat-value">${char.atk}</span>
                                </div>
                            </div>
                            <p class="description">${char.description}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="actions">
                    <button class="btn-primary" 
                            onclick="window.characterSelection.startGame()" 
                            ${!this.selectedCharacter ? 'disabled' : ''}>
                        Start Adventure
                    </button>
                </div>
            </div>
        `;
    }

    getCharacterIcon(characterType) {
        const icons = {
            warrior: '⚔️',
            mage: '🔮',
            archer: '🏹',
            healer: '💚',
            rogue: '🗡️'
        };
        return icons[characterType] || '👤';
    }

    selectCharacter(characterType) {
        this.selectedCharacter = characterType;
        this.render(); // Re-render to show selection
    }

    async startGame() {
        if (!this.selectedCharacter) return;

        try {
            const response = await fetch('/select-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character: this.selectedCharacter })
            });
            
            const data = await response.json();
            if (data.status === 'ok') {
                // Store player data for GamePage to use
                localStorage.setItem('playerData', JSON.stringify({
                    playerId: data.player_id,
                    player: data.player,
                    characterClass: this.selectedCharacter
                }));
                window.router.navigate('/game');
            }
        } catch (error) {
            console.error('Error selecting character:', error);
            alert('Error selecting character. Please try again.');
        }
    }
}
