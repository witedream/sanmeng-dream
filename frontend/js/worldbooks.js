// World Books module
const WorldBooks = {
    async render() {
        const container = document.getElementById('page-container');

        container.innerHTML = `
            <div class="page-header">
                <h2>📖 世界书</h2>
                <button class="btn btn-primary" id="btn-add-wb">+ 新建条目</button>
            </div>
            <div id="wb-list"><div class="empty-state"><p>加载中...</p></div></div>
        `;

        document.getElementById('btn-add-wb').addEventListener('click', () => this.showEditor());
        await this.loadList();
    },

    async loadList() {
        const list = document.getElementById('wb-list');
        try {
            const wbs = await API.getWorldBooks();
            if (wbs.length === 0) {
                list.innerHTML = '<div class="empty-state"><div class="empty-icon">📖</div><p>还没有世界书条目，点击新建</p></div>';
                return;
            }
            list.innerHTML = `<div class="grid">${wbs.map(w => `
                <div class="card wb-card" data-id="${w.id}">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:600;font-size:15px;margin-bottom:4px;">${w.title}</div>
                            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">
                                ${w.content || '暂无内容'}
                            </div>
                            <div>
                                <span class="wb-tag">${w.category}</span>
                                ${(w.tags || '').split(',').filter(Boolean).map(t => `<span class="wb-tag">${t.trim()}</span>`).join('')}
                            </div>
                        </div>
                        <div style="display:flex;gap:4px;flex-shrink:0;margin-left:12px;">
                            <button class="btn btn-sm btn-outline btn-edit-wb" data-id="${w.id}">编辑</button>
                            <button class="btn btn-sm btn-danger btn-del-wb" data-id="${w.id}" data-name="${w.title}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('')}</div>`;

            list.querySelectorAll('.btn-edit-wb').forEach(el => {
                el.addEventListener('click', e => { e.stopPropagation(); this.showEditor(parseInt(el.dataset.id)); });
            });
            list.querySelectorAll('.btn-del-wb').forEach(el => {
                el.addEventListener('click', e => {
                    e.stopPropagation();
                    if (confirm(`确定删除「${el.dataset.name}」吗？`)) {
                        API.deleteWorldBook(parseInt(el.dataset.id)).then(() => this.loadList()).catch(e => showToast(e.message, 'error'));
                    }
                });
            });
        } catch (e) {
            list.innerHTML = `<div class="empty-state"><p>❌ ${e.message}</p></div>`;
        }
    },

    async showEditor(id) {
        let wb = { title: '', content: '', tags: '', category: 'general' };
        if (id) {
            try { wb = await API.getWorldBook(id); } catch (e) { showToast(e.message, 'error'); return; }
        }

        const isNew = !id;
        openModal(isNew ? '新建世界书条目' : '编辑世界书条目', `
            <form id="wb-form">
                <div class="form-group">
                    <label>标题 *</label>
                    <input class="form-control" name="title" value="${wb.title || ''}" required placeholder="如：提瓦特大陆设定">
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <select class="form-control" name="category">
                        <option value="general" ${wb.category === 'general' ? 'selected' : ''}>通用</option>
                        <option value="geography" ${wb.category === 'geography' ? 'selected' : ''}>地理</option>
                        <option value="history" ${wb.category === 'history' ? 'selected' : ''}>历史</option>
                        <option value="magic" ${wb.category === 'magic' ? 'selected' : ''}>魔法/科技</option>
                        <option value="culture" ${wb.category === 'culture' ? 'selected' : ''}>文化</option>
                        <option value="faction" ${wb.category === 'faction' ? 'selected' : ''}>组织/势力</option>
                        <option value="character" ${wb.category === 'character' ? 'selected' : ''}>角色关系</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>标签 (逗号分隔)</label>
                    <input class="form-control" name="tags" value="${wb.tags || ''}" placeholder="如：奇幻, 魔法, 学院">
                </div>
                <div class="form-group">
                    <label>内容</label>
                    <textarea class="form-control" name="content" rows="12" placeholder="详细描述这个世界观设定…">${wb.content || ''}</textarea>
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">${isNew ? '创建' : '保存'}</button>
                </div>
            </form>
        `);

        document.getElementById('wb-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd.entries());

            try {
                if (isNew) {
                    await API.createWorldBook(data);
                    showToast('世界书条目创建成功！', 'success');
                } else {
                    await API.updateWorldBook(id, data);
                    showToast('条目已更新', 'success');
                }
                closeModal();
                await this.loadList();
            } catch (e) {
                showToast(e.message, 'error');
            }
        });
    }
};
