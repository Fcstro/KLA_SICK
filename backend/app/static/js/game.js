
// SPA Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize page components
    window.landingPage = new LandingPage();
    window.characterSelection = new CharacterSelection();
    window.gamePage = new GamePage();
    
    // Router will handle initial page load
    console.log('WebAR RPG initialized');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gamePage) {
        gamePage.cleanup();
    }
});
