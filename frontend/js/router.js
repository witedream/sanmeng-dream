// Hash-based router
const Router = {
    routes: {},
    currentPage: null,

    register(name, renderFn) {
        this.routes[name] = renderFn;
    },

    navigate(hash) {
        const page = hash.replace('#/', '') || 'dashboard';
        const render = this.routes[page];
        if (render) {
            this.currentPage = page;
            render();
            this.updateSidebar(page);
            this.updateTitle(page);
        }
    },

    updateSidebar(page) {
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });
    },

    updateTitle(page) {
        const titles = {
            dashboard: '首页',
            characters: '角色管理',
            worldbooks: '世界书',
            llm: '大模型设置',
            chat: '聊天',
        };
        document.getElementById('page-title').textContent = titles[page] || '梦女站';
    },

    init() {
        window.addEventListener('hashchange', () => this.navigate(window.location.hash));
        this.navigate(window.location.hash || '#/');
    }
};
