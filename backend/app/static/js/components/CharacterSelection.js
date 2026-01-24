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
                    <h1>🎮 WebAR RPG</h1>
                    <h2>Choose Your Hero</h2>
                </div>
                
                <div class="characters-grid">
                    ${Object.entries(this.characters).map(([key, char]) => `
                        <div class="character-card ${this.selectedCharacter === key ? 'selected' : ''}" 
                             onclick="characterSelection.selectCharacter('${key}')">
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
                            onclick="characterSelection.startGame()" 
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
                router.navigate('/game');
            }
        } catch (error) {
            console.error('Error selecting character:', error);
            alert('Error selecting character. Please try again.');
        }
    }
}

const characterSelection = new CharacterSelection();
