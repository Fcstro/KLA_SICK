
// SPA Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing WebAR RPG...');
    
    // Initialize page components
    window.landingPage = new LandingPage();
    console.log('✅ LandingPage initialized');
    
    window.characterSelection = new CharacterSelection();
    console.log('✅ CharacterSelection initialized');
    
    window.gamePage = new GamePage();
    console.log('✅ GamePage initialized');
    
    // Initialize router after components are ready
    window.router = new Router();
    window.router.init();
    console.log('✅ Router initialized and started');
    
    console.log('🎮 WebAR RPG fully loaded and ready!');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gamePage) {
        gamePage.cleanup();
    }
});
