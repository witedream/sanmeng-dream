// Dashboard module
const Dashboard = {
    async render() {
        const container = document.getElementById('page-container');
        container.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const [chars, wbs, configs, sessions] = await Promise.all([
                API.getCharacters(),
                API.getWorldBooks(),
                API.getLLMConfigs(),
                API.getChatSessions(),
            ]);

            container.innerHTML = `
                <div class="page-header">
                    <h2>🌸 首页</h2>
                </div>

                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-number">${chars.length}</div>
                        <div class="stat-label">角色</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${wbs.length}</div>
                        <div class="stat-label">世界书条目</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${configs.length}</div>
                        <div class="stat-label">模型配置</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${sessions.length}</div>
                        <div class="stat-label">聊天记录</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>📝 快速开始</h3>
                    </div>
                    <ol style="margin-left:20px; line-height:2.2; color: var(--text-secondary);">
                        <li>先去 <a href="#/characters">角色管理</a> 创建你的角色人设</li>
                        <li>在 <a href="#/worldbooks">世界书</a> 中添加世界观设定</li>
                        <li>在 <a href="#/llm">大模型设置</a> 中配置API密钥和模型</li>
                        <li>最后去 <a href="#/chat">聊天</a> 开始对话吧！</li>
                    </ol>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>📜 最近的对话</h3>
                    </div>
                    ${sessions.length === 0 ? '<div class="empty-state"><p>还没有对话记录</p></div>' : `
                    <ul class="dashboard-recent">
                        ${sessions.slice(0, 5).map(s => `
                            <li>
                                <span>💬</span>
                                <a href="#/chat" data-session="${s.id}" class="session-link" style="flex:1;color:var(--text);">
                                    ${s.title}
                                </a>
                                <small style="color:var(--text-secondary)">${new Date(s.updated_at).toLocaleDateString()}</small>
                            </li>
                        `).join('')}
                    </ul>
                    `}
                </div>
            `;

            // Click handler for session links
            container.querySelectorAll('.session-link').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sid = el.dataset.session;
                    window.location.hash = '#/chat';
                    sessionStorage.setItem('openSessionId', sid);
                });
            });

        } catch (e) {
            container.innerHTML = `<div class="empty-state"><p>❌ 加载失败：${e.message}</p></div>`;
        }
    }
};
