// Simple SPA Router
class Router {
    constructor() {
        this.routes = {
            '/': () => {
                if (window.landingPage) landingPage.render();
                else console.error('LandingPage not loaded');
            },
            '/character': () => {
                if (window.characterSelection) characterSelection.render();
                else console.error('CharacterSelection not loaded');
            },
            '/game': () => {
                if (window.gamePage) gamePage.render();
                else console.error('GamePage not loaded');
            }
        };
        
        this.currentRoute = '/';
        this.routerReady = false;
    }

    init() {
        this.routerReady = true;
        // Handle initial route
        this.handleRoute();
        
        // Handle navigation
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('data-route'));
            }
        });
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.currentRoute = path;
        this.handleRoute();
    }

    handleRoute() {
        if (!this.routerReady) return;
        
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/'];
        
        // Cleanup previous page
        if (this.currentPage) {
            this.currentPage.cleanup();
        }
        
        // Render new page
        try {
            route();
        } catch (error) {
            console.error('Route error:', error);
        }
    }
}

// Initialize router (but don't start until components are ready)
let router;
