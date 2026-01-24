// Simple SPA Router
class Router {
    constructor() {
        this.routes = {
            '/': () => landingPage.render(),
            '/character': () => characterSelection.render(),
            '/game': () => gamePage.render()
        };
        
        this.currentRoute = '/';
        this.init();
    }

    init() {
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
        const path = window.location.pathname;
        const route = this.routes[path] || this.routes['/'];
        
        // Cleanup previous page
        if (this.currentPage) {
            this.currentPage.cleanup();
        }
        
        // Render new page
        route();
    }
}

// Initialize router
const router = new Router();
