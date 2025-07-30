// blueprint.js - persistent, per-user blueprint storage for Mindbloom
// Requires auth.js (window.getCurrentUser)

(function() {
    // Use a promise to get the current user's email (if logged in)
    async function getUserKey() {
        if (window.getCurrentUser) {
            try {
                const user = await window.getCurrentUser();
                if (user && user.email) return `mindbloom_blueprint_${user.email}`;
            } catch (e) { /* fallback below */ }
        }
        // Fallback: guest or no auth
        return 'mindbloom_blueprint_guest';
    }

    // Save blueprint data (nodes, links) to localStorage
    async function saveBlueprint(nodes, links) {
        const key = await getUserKey();
        localStorage.setItem(key, JSON.stringify({ nodes, links }));
    }

    // Load blueprint data from localStorage
    async function loadBlueprint() {
        const key = await getUserKey();
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const { nodes, links } = JSON.parse(raw);
                return { nodes: nodes || [], links: links || [] };
            } catch {
                return { nodes: [], links: [] };
            }
        }
        return { nodes: [], links: [] };
    }

    // Expose globally for blueprint.html
    window.saveBlueprint = saveBlueprint;
    window.loadBlueprint = loadBlueprint;
})();
