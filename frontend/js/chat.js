// Chat module
const Chat = {
    currentSessionId: null,
    currentCharacterId: null,
    sessions: [],
    characters: [],
    isSending: false,
    openInitialSessionId: null,

    async render() {
        this.openInitialSessionId = sessionStorage.getItem('openSessionId');
        if (this.openInitialSessionId) {
            sessionStorage.removeItem('openSessionId');
        }

        const container = document.getElementById('page-container');

        try {
            this.characters = await API.getCharacters();
            this.sessions = await API.getChatSessions();
        } catch (e) {
            // continue with empty
        }

        const charOpts = this.characters.map(c =>
            `<option value="${c.id}">${c.name}</option>`
        ).join('');

        container.innerHTML = `
            <div class="chat-layout">
                <div class="chat-sessions">
                    <div class="chat-sessions-header">
                        <h3>💬 对话</h3>
                        <button class="btn btn-sm btn-primary" id="btn-new-chat">新对话</button>
                    </div>
                    <div style="padding:8px 12px 0;">
                        <select class="form-control" id="chat-char-filter" style="font-size:13px;">
                            <option value="0">全部角色</option>
                            ${charOpts}
                        </select>
                    </div>
                    <div class="chat-session-list" id="session-list">
                        ${this.renderSessionList()}
                    </div>
                </div>
                <div class="chat-main" id="chat-main-area">
                    <div class="chat-welcome" id="chat-welcome">
                        <div class="welcome-icon">💬</div>
                        <p>选择一个对话或创建新对话</p>
                        <p class="hint">需要先创建角色和模型配置才能聊天哦</p>
                    </div>
                    <div id="chat-messages" class="chat-messages hidden"></div>
                    <div id="chat-input-area" class="chat-input-area hidden">
                        <textarea id="chat-input" rows="1" placeholder="输入消息..." enterkeyhint="send"></textarea>
                        <button class="btn-send" id="btn-send">➤</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();

        if (this.openInitialSessionId) {
            this.openSession(parseInt(this.openInitialSessionId));
        }
    },

    renderSessionList() {
        if (this.sessions.length === 0) {
            return '<div class="empty-state" style="padding:24px;"><p>暂无对话</p></div>';
        }
        return this.sessions.map(s => `
            <div class="chat-session-item ${s.id === this.currentSessionId ? 'active' : ''}" data-session-id="${s.id}">
                <span class="sess-title">${s.title}</span>
                <span class="sess-time">${new Date(s.updated_at).toLocaleDateString()}</span>
            </div>
        `).join('');
    },

    bindEvents() {
        document.getElementById('btn-new-chat').addEventListener('click', () => this.newChat());
        document.getElementById('chat-char-filter').addEventListener('change', async (e) => {
            const cid = parseInt(e.target.value);
            try {
                this.sessions = await API.getChatSessions(cid);
            } catch (_) {}
            document.getElementById('session-list').innerHTML = this.renderSessionList();
            this.bindSessionClicks();
        });

        document.getElementById('session-list').addEventListener('click', (e) => {
            const item = e.target.closest('.chat-session-item');
            if (item) {
                this.openSession(parseInt(item.dataset.sessionId));
            }
        });

        // Send message
        const input = document.getElementById('chat-input');
        const btn = document.getElementById('btn-send');
        if (input && btn) {
            btn.addEventListener('click', () => this.send());
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.send();
                }
            });
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }
    },

    async newChat() {
        if (this.characters.length === 0) {
            showToast('请先在角色管理中创建角色', 'error');
            return;
        }

        // Show character picker modal
        const charList = this.characters.map(c =>
            `<button class="btn btn-outline char-pick-btn" data-id="${c.id}" style="padding:12px 16px;text-align:left;width:100%;justify-content:flex-start;border-radius:8px;">
                ${c.avatar || '👤'} ${c.name}
            </button>`
        ).join('');

        openModal('选择角色', `
            <p style="margin-bottom:12px;color:var(--text-secondary);">选择要对话的角色：</p>
            <div style="display:flex;flex-direction:column;gap:6px;">${charList}</div>
        `);

        document.querySelectorAll('.char-pick-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                closeModal();
                const charId = parseInt(btn.dataset.id);
                try {
                    const session = await API.createChatSession({ character_id: charId });
                    this.sessions.unshift(session);
                    this.currentSessionId = session.id;
                    this.currentCharacterId = charId;
                    await this.refreshUI();
                    this.openSession(session.id);
                    showToast(`开始和 ${this.characters.find(c => c.id === charId)?.name || ''} 对话`, 'success');
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        });
    },

    async openSession(sessionId) {
        try {
            const session = await API.getChatSession(sessionId);
            this.currentSessionId = session.id;
            this.currentCharacterId = session.character_id;

            // Update session list active state
            document.querySelectorAll('.chat-session-item').forEach(el => {
                el.classList.toggle('active', parseInt(el.dataset.sessionId) === session.id);
            });

            const msgArea = document.getElementById('chat-messages');
            const inputArea = document.getElementById('chat-input-area');
            const welcome = document.getElementById('chat-welcome');

            welcome.classList.add('hidden');
            msgArea.classList.remove('hidden');
            inputArea.classList.remove('hidden');

            if (session.messages.length === 0) {
                // Show greeting if available
                msgArea.innerHTML = '';
                if (session.character && session.character.greeting) {
                    this.appendMessage('assistant', session.character.greeting, session.character);
                }
            } else {
                msgArea.innerHTML = session.messages.map(m => {
                    const charData = session.character || this.characters.find(c => c.id === session.character_id);
                    if (m.role === 'system') return '';
                    return this.renderMessage(m.role, m.content, charData);
                }).join('');
                msgArea.scrollTop = msgArea.scrollHeight;
            }

            // Update chat title
            const titleEl = document.querySelector('.chat-title');
            if (!titleEl) {
                const header = document.querySelector('.chat-main-header');
                if (!header) {
                    const mainArea = document.getElementById('chat-main-area');
                    const newHeader = document.createElement('div');
                    newHeader.className = 'chat-main-header';
                    newHeader.innerHTML = `<span class="chat-title">${session.title}</span>`;
                    mainArea.insertBefore(newHeader, mainArea.firstChild);
                } else {
                    header.querySelector('.chat-title').textContent = session.title;
                }
            } else {
                titleEl.textContent = session.title;
            }

            this.bindEvents();
        } catch (e) {
            showToast(e.message, 'error');
        }
    },

    renderMessage(role, content, charData) {
        const avatar = role === 'assistant' ? (charData?.avatar || '💭') : '👤';
        const time = new Date().toLocaleTimeString();
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        return `
            <div class="chat-msg ${role}">
                <div class="chat-msg-avatar">${avatar}</div>
                <div>
                    <div class="chat-msg-bubble">${escapedContent}</div>
                </div>
            </div>
        `;
    },

    appendMessage(role, content, charData) {
        const msgArea = document.getElementById('chat-messages');
        if (!msgArea) return;
        // Remove typing indicator if present
        const typing = msgArea.querySelector('.chat-msg.typing');
        if (typing) typing.remove();

        msgArea.insertAdjacentHTML('beforeend', this.renderMessage(role, content, charData));
        msgArea.scrollTop = msgArea.scrollHeight;
    },

    showTypingIndicator() {
        const msgArea = document.getElementById('chat-messages');
        if (!msgArea) return;
        // Remove existing typing indicator
        const existing = msgArea.querySelector('.chat-msg.typing');
        if (existing) existing.remove();

        msgArea.insertAdjacentHTML('beforeend', `
            <div class="chat-msg assistant typing">
                <div class="chat-msg-avatar">💭</div>
                <div>
                    <div class="chat-msg-bubble">正在输入...</div>
                </div>
            </div>
        `);
        msgArea.scrollTop = msgArea.scrollHeight;
    },

    async send() {
        if (this.isSending) return;
        const input = document.getElementById('chat-input');
        const content = input.value.trim();
        if (!content) return;

        if (!this.currentSessionId) {
            showToast('请先选择或创建一个对话', 'error');
            return;
        }

        this.isSending = true;
        const btn = document.getElementById('btn-send');
        if (btn) btn.disabled = true;

        // Append user message
        const charData = this.characters.find(c => c.id === this.currentCharacterId);
        this.appendMessage('user', content, charData);
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const result = await API.sendMessage(this.currentSessionId, content);
            // Remove typing indicator and add assistant response
            const msgArea = document.getElementById('chat-messages');
            const typing = msgArea.querySelector('.chat-msg.typing');
            if (typing) typing.remove();
            this.appendMessage('assistant', result.content, charData);

            // Update session list
            this.sessions = await API.getChatSessions();
            document.getElementById('session-list').innerHTML = this.renderSessionList();
        } catch (e) {
            const msgArea = document.getElementById('chat-messages');
            const typing = msgArea.querySelector('.chat-msg.typing');
            if (typing) typing.remove();
            this.appendMessage('assistant', `❌ 回复失败：${e.message}`, charData);
        } finally {
            this.isSending = false;
            if (btn) btn.disabled = false;
            input.focus();
        }
    },

    async refreshUI() {
        try {
            this.sessions = await API.getChatSessions();
        } catch (_) {}
        const list = document.getElementById('session-list');
        if (list) {
            list.innerHTML = this.renderSessionList();
        }
    }
};
