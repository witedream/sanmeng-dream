// === Global helpers ===
function openModal(title, bodyHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-container').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-container').classList.add('hidden');
}

function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', closeModal);
document.querySelector('.modal-close').addEventListener('click', closeModal);

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Sidebar toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
});

document.getElementById('sidebar-close').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
});

document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
});

// Close sidebar on nav click (mobile)
document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('open');
    });
});

// === Register routes ===
Router.register('dashboard', () => Dashboard.render());
Router.register('characters', () => Characters.render());
Router.register('worldbooks', () => WorldBooks.render());
Router.register('llm', () => LLM.render());
Router.register('chat', () => Chat.render());

// === Init ===
document.addEventListener('DOMContentLoaded', () => Router.init());
