
// SPA Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Setup routes
    router.route('/', characterSelection);
    router.route('/game', gamePage);
    
    // Handle initial route
    router.handleRoute();
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gamePage) {
        gamePage.cleanup();
    }
});
