// Simple SPA Router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    route(path, component) {
        this.routes[path] = component;
    }

    navigate(path) {
        history.pushState(null, null, path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const component = this.routes[path] || this.routes['/'];
        
        if (component) {
            this.currentRoute = path;
            component.render();
        }
    }
}

const router = new Router();
