// Characters module
const Characters = {
    async render() {
        const container = document.getElementById('page-container');

        container.innerHTML = `
            <div class="page-header">
                <h2>👤 角色管理</h2>
                <button class="btn btn-primary" id="btn-add-char">+ 新建角色</button>
            </div>
            <div id="char-list"><div class="empty-state"><p>加载中...</p></div></div>
        `;

        document.getElementById('btn-add-char').addEventListener('click', () => this.showEditor());
        await this.loadList();
    },

    async loadList() {
        const list = document.getElementById('char-list');
        try {
            const chars = await API.getCharacters();
            if (chars.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><p>还没有角色，点击右上角新建</p></div>';
                return;
            }
            list.innerHTML = `<div class="grid">${chars.map(c => `
                <div class="card char-card" data-id="${c.id}">
                    <div class="char-row">
                        <div class="char-avatar">${c.avatar || '👤'}</div>
                        <div class="char-info">
                            <div class="char-name">${c.name}</div>
                            <div class="char-desc">${c.personality ? c.personality.slice(0, 60) + '...' : '暂无性格描述'}</div>
                        </div>
                        <div class="char-actions">
                            <button class="btn btn-sm btn-outline btn-edit" data-id="${c.id}">编辑</button>
                            <button class="btn btn-sm btn-danger btn-del" data-id="${c.id}" data-name="${c.name}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('')}</div>`;

            list.querySelectorAll('.btn-edit').forEach(el => {
                el.addEventListener('click', e => { e.stopPropagation(); this.showEditor(parseInt(el.dataset.id)); });
            });
            list.querySelectorAll('.btn-del').forEach(el => {
                el.addEventListener('click', e => {
                    e.stopPropagation();
                    if (confirm(`确定删除「${el.dataset.name}」吗？`)) {
                        API.deleteCharacter(parseInt(el.dataset.id)).then(() => this.loadList()).catch(e => showToast(e.message, 'error'));
                    }
                });
            });
            list.querySelectorAll('.char-card').forEach(el => {
                el.addEventListener('click', () => this.showEditor(parseInt(el.dataset.id)));
            });
        } catch (e) {
            list.innerHTML = `<div class="empty-state"><p>❌ ${e.message}</p></div>`;
        }
    },

    async showEditor(id) {
        let char = { name: '', avatar: '', appearance: '', personality: '', backstory: '', greeting: '', example_dialogue: '', system_prompt: '' };
        if (id) {
            try { char = await API.getCharacter(id); } catch (e) { showToast(e.message, 'error'); return; }
        }

        const isNew = !id;
        openModal(isNew ? '新建角色' : '编辑角色', `
            <form id="char-form">
                <div class="form-group">
                    <label>角色名 *</label>
                    <input class="form-control" name="name" value="${char.name || ''}" required placeholder="如：白夜梦">
                </div>
                <div class="form-group">
                    <label>头像 (可输入emoji或图片链接)</label>
                    <input class="form-control" name="avatar" value="${char.avatar || ''}" placeholder="🎀 或 https://...">
                </div>
                <div class="form-group">
                    <label>外貌描写</label>
                    <textarea class="form-control" name="appearance" rows="3" placeholder="白色头发、粉色眼睛、粉白色蕾丝连衣裙…">${char.appearance || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>性格设定</label>
                    <textarea class="form-control" name="personality" rows="4" placeholder="描述角色的性格特点、说话方式…">${char.personality || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>背景故事</label>
                    <textarea class="form-control" name="backstory" rows="5" placeholder="角色的过去经历、重要事件…">${char.backstory || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>开场白</label>
                    <textarea class="form-control" name="greeting" rows="2" placeholder="角色第一次见面时说的话">${char.greeting || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>示例对话</label>
                    <textarea class="form-control" name="example_dialogue" rows="4" placeholder="展示角色的说话风格和语气…">${char.example_dialogue || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>自定义System Prompt (可选)</label>
                    <textarea class="form-control" name="system_prompt" rows="4" placeholder="额外系统指令，会放在所有设定前面">${char.system_prompt || ''}</textarea>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">${isNew ? '创建' : '保存'}</button>
                </div>
            </form>
        `);

        document.getElementById('char-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());

            try {
                if (isNew) {
                    await API.createCharacter(data);
                    showToast('角色创建成功！', 'success');
                } else {
                    await API.updateCharacter(id, data);
                    showToast('角色已更新', 'success');
                }
                closeModal();
                await this.loadList();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    }
};
