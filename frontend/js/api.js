// API client
const API = {
    base: '',

    async request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body !== undefined) opts.body = JSON.stringify(body);

        try {
            const res = await fetch(this.base + path, opts);
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`);
            }
            if (res.status === 204) return null;
            return await res.json();
        } catch (e) {
            if (e.message.includes('Failed to fetch')) {
                throw new Error('无法连接服务器，请确认后端已启动');
            }
            throw e;
        }
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    put(path, body) { return this.request('PUT', path, body); },
    del(path) { return this.request('DELETE', path); },

    // Characters
    getCharacters() { return this.get('/api/characters'); },
    getCharacter(id) { return this.get(`/api/characters/${id}`); },
    createCharacter(data) { return this.post('/api/characters', data); },
    updateCharacter(id, data) { return this.put(`/api/characters/${id}`, data); },
    deleteCharacter(id) { return this.del(`/api/characters/${id}`); },

    // World Books
    getWorldBooks() { return this.get('/api/worldbooks'); },
    getWorldBook(id) { return this.get(`/api/worldbooks/${id}`); },
    createWorldBook(data) { return this.post('/api/worldbooks', data); },
    updateWorldBook(id, data) { return this.put(`/api/worldbooks/${id}`, data); },
    deleteWorldBook(id) { return this.del(`/api/worldbooks/${id}`); },

    // LLM Configs
    getLLMConfigs() { return this.get('/api/llm-configs'); },
    getDefaultLLMConfig() { return this.get('/api/llm-configs/default'); },
    getLLMConfig(id) { return this.get(`/api/llm-configs/${id}`); },
    createLLMConfig(data) { return this.post('/api/llm-configs', data); },
    updateLLMConfig(id, data) { return this.put(`/api/llm-configs/${id}`, data); },
    deleteLLMConfig(id) { return this.del(`/api/llm-configs/${id}`); },

    // Chat Sessions
    getChatSessions(characterId = 0) {
        return this.get(`/api/chat/sessions${characterId ? `?character_id=${characterId}` : ''}`);
    },
    getChatSession(id) { return this.get(`/api/chat/sessions/${id}`); },
    createChatSession(data) { return this.post('/api/chat/sessions', data); },
    deleteChatSession(id) { return this.del(`/api/chat/sessions/${id}`); },
    updateSessionTitle(id, title) { return this.put(`/api/chat/sessions/${id}/title`, { title }); },

    // Chat Messages
    sendMessage(sessionId, content) {
        return this.post(`/api/chat/sessions/${sessionId}/send`, { content });
    },
};
