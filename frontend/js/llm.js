// LLM Config module
const LLM = {
    async render() {
        const container = document.getElementById('page-container');

        container.innerHTML = `
            <div class="page-header">
                <h2>🤖 大模型设置</h2>
                <button class="btn btn-primary" id="btn-add-llm">+ 添加配置</button>
            </div>
            <div class="card" style="margin-bottom:20px;">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
                    支持任何 OpenAI 兼容的 API。填入 API 地址、密钥和模型名即可使用。<br>
                    常见提供方：OpenAI / DeepSeek / 通义千问 / 硅基流动 / 本地Ollama等
                </p>
            </div>
            <div id="llm-list"><div class="empty-state"><p>加载中...</p></div></div>
        `;

        document.getElementById('btn-add-llm').addEventListener('click', () => this.showEditor());
        await this.loadList();
    },

    async loadList() {
        const list = document.getElementById('llm-list');
        try {
            const configs = await API.getLLMConfigs();
            if (configs.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-icon">🤖</div><p>还没有模型配置，点击添加</p></div>';
                return;
            }
            list.innerHTML = configs.map(c => `
                <div class="card llm-card" data-id="${c.id}" style="${c.is_default ? 'border-left-color: var(--primary);' : ''}">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                        <div style="flex:1;min-width:200px;">
                            <div style="font-weight:600;font-size:15px;">
                                ${c.name}
                                ${c.is_default ? '<span class="badge badge-default">默认</span>' : ''}
                            </div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;word-break:break-all;">
                                提供方：${c.provider}<br>
                                接口：${c.base_url}<br>
                                模型：${c.model}
                            </div>
                        </div>
                        <div style="display:flex;gap:6px;flex-shrink:0;">
                            <button class="btn btn-sm btn-outline btn-set-default" data-id="${c.id}" ${c.is_default ? 'disabled style="opacity:0.5"' : ''}>设为默认</button>
                            <button class="btn btn-sm btn-outline btn-edit-llm" data-id="${c.id}">编辑</button>
                            <button class="btn btn-sm btn-danger btn-del-llm" data-id="${c.id}" data-name="${c.name}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.btn-edit-llm').forEach(el => {
                el.addEventListener('click', e => { e.stopPropagation(); this.showEditor(parseInt(el.dataset.id)); });
            });
            list.querySelectorAll('.btn-del-llm').forEach(el => {
                el.addEventListener('click', e => {
                    e.stopPropagation();
                    if (confirm(`确定删除配置「${el.dataset.name}」吗？`)) {
                        API.deleteLLMConfig(parseInt(el.dataset.id)).then(() => this.loadList()).catch(e => showToast(e.message, 'error'));
                    }
                });
            });
            list.querySelectorAll('.btn-set-default').forEach(el => {
                el.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (el.disabled) return;
                    try {
                        await API.updateLLMConfig(parseInt(el.dataset.id), { is_default: true });
                        showToast('已设为默认模型', 'success');
                        await this.loadList();
                    } catch (e) { showToast(e.message, 'error'); }
                });
            });
        } catch (e) {
            list.innerHTML = `<div class="empty-state"><p>❌ ${e.message}</p></div>`;
        }
    },

    providers: [
        { name: 'OpenAI', base_url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
        { name: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
        { name: '通义千问', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
        { name: '硅基流动', base_url: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct' },
        { name: 'Ollama (本地)', base_url: 'http://localhost:11434/v1', model: 'llama3' },
        { name: '自定义', base_url: '', model: '' },
    ],

    async showEditor(id) {
        let config = { name: '', provider: 'custom', base_url: 'https://api.openai.com/v1', api_key: '', model: 'gpt-3.5-turbo', max_tokens: 2048, temperature: 0.7, top_p: 0.9 };
        if (id) {
            try { config = await API.getLLMConfig(id); } catch (e) { showToast(e.message, 'error'); return; }
        }

        const isNew = !id;
        const provOpts = this.providers.map(p => {
            const sel = config.provider === p.name || (p.name === '自定义' && !this.providers.find(pp => pp.name === config.provider))
                ? 'selected' : '';
            return `<option value="${p.name}" ${sel}>${p.name}</option>`;
        }).join('');

        openModal(isNew ? '添加模型配置' : '编辑模型配置', `
            <form id="llm-form">
                <div class="form-group">
                    <label>配置名称 *</label>
                    <input class="form-control" name="name" value="${config.name || ''}" required placeholder="如：我的DeepSeek">
                </div>
                <div class="form-group">
                    <label>提供方 (快速填写)</label>
                    <select class="form-control" id="provider-select">
                        ${provOpts}
                    </select>
                </div>
                <div class="form-group">
                    <label>API 地址 *</label>
                    <input class="form-control" name="base_url" id="base-url-input" value="${config.base_url || ''}" required placeholder="https://api.openai.com/v1">
                </div>
                <div class="form-group">
                    <label>API Key *</label>
                    <input class="form-control" name="api_key" id="api-key-input" value="${config.api_key || ''}" placeholder="sk-..." type="password">
                    ${!isNew ? '<small style="color:var(--text-secondary);">留空则不修改</small>' : ''}
                </div>
                <div class="form-group">
                    <label>模型名 *</label>
                    <input class="form-control" name="model" id="model-input" value="${config.model || ''}" required placeholder="gpt-4o-mini">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label>Max Tokens</label>
                        <input class="form-control" name="max_tokens" type="number" value="${config.max_tokens || 2048}">
                    </div>
                    <div class="form-group">
                        <label>Temperature</label>
                        <input class="form-control" name="temperature" type="number" step="0.05" min="0" max="2" value="${config.temperature || 0.7}">
                    </div>
                    <div class="form-group">
                        <label>Top P</label>
                        <input class="form-control" name="top_p" type="number" step="0.05" min="0" max="1" value="${config.top_p || 0.9}">
                    </div>
                    <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:10px;">
                        <label><input type="checkbox" name="is_default" ${config.is_default ? 'checked' : ''}> 设为默认</label>
                    </div>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">${isNew ? '添加' : '保存'}</button>
                </div>
            </form>
        `);

        // Provider auto-fill
        const provSel = document.getElementById('provider-select');
        const urlInput = document.getElementById('base-url-input');
        const modelInput = document.getElementById('model-input');

        provSel.addEventListener('change', () => {
            const prov = this.providers.find(p => p.name === provSel.value);
            if (prov) {
                if (prov.base_url) urlInput.value = prov.base_url;
                if (prov.model) modelInput.value = prov.model;
            }
        });

        document.getElementById('llm-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());
            data.max_tokens = parseInt(data.max_tokens) || 2048;
            data.temperature = parseFloat(data.temperature) || 0.7;
            data.top_p = parseFloat(data.top_p) || 0.9;
            data.is_default = !!data.is_default;
            data.provider = document.getElementById('provider-select').value;

            if (!isNew && !data.api_key) {
                delete data.api_key;
            }

            try {
                if (isNew) {
                    await API.createLLMConfig(data);
                    showToast('模型配置已添加！', 'success');
                } else {
                    await API.updateLLMConfig(id, data);
                    showToast('配置已更新', 'success');
                }
                closeModal();
                await this.loadList();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    }
};
