// Character Selection Component
class CharacterSelection {
    constructor() {
        this.characters = {
            "Volta": { name: "Volta", hp: 120, atk: 15, description: "High health, balanced damage" },
            "Pedro Penduko": { name: "Pedro Penduko", hp: 80, atk: 25, description: "Low health, high damage" },
            "Kidlat": { name: "Kidlat", hp: 100, atk: 18, description: "Balanced stats" },
            "Victor Magtanggol": { name: "Victor Magtanggol", hp: 110, atk: 12, description: "High health, support role" },
            "WaPakMan": { name: "WaPakMan", hp: 90, atk: 20, description: "Medium health, high damage" }
        };
        this.selectedCharacter = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="character-selection">
                <div class="header">
                    <div class="logo-container">
                        <span class="word left">KLA</span>
                        <span class="word right">SICK</span>
                    </div>
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
            "Volta": '⚔️',
            "Pedro Penduko": '🔮',
            "Kidlat": '🏹',
            "Victor Magtanggol": '💚',
            "WaPakMan": '🗡️'
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
