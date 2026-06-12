// Modal genérico reutilizable: open(title, bodyHTML, actions). Sin libs externas.
window.App = window.App || {};

(() => {
  'use strict';

  const Modal = {};
  let root = null;
  let onSubmitCb = null;

  // Construye el contenedor una sola vez.
  const ensureRoot = () => {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'modal-backdrop';
    root.innerHTML = `
      <div class="modal-window" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3 id="modal-title"></h3>
          <button class="modal-close" aria-label="Cerrar">&times;</button>
        </header>
        <div class="modal-body" id="modal-body"></div>
        <footer class="modal-footer" id="modal-footer"></footer>
      </div>
    `;
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) Modal.close(); });
    root.querySelector('.modal-close').addEventListener('click', Modal.close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') Modal.close(); });
    return root;
  };

  // Abre el modal con un título, cuerpo HTML y botones.
  Modal.open = ({ title, body, actions = [], onSubmit = null }) => {
    ensureRoot();
    root.querySelector('#modal-title').textContent = title;
    root.querySelector('#modal-body').innerHTML = body;
    const footer = root.querySelector('#modal-footer');
    footer.innerHTML = actions.map(a =>
      `<button class="btn ${a.kind || ''}" data-act="${a.id}">${a.label}</button>`
    ).join('');
    footer.querySelectorAll('button[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.act;
        const action = actions.find(a => a.id === id);
        if (action && action.onClick) action.onClick();
      });
    });
    onSubmitCb = onSubmit;
    root.classList.add('open');
    window.App.Utils.refreshIcons();
    // Enfoca primer input.
    setTimeout(() => {
      const first = root.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
      if (first) first.focus();
    }, 50);
  };

  // Cierra el modal.
  Modal.close = () => { if (root) root.classList.remove('open'); onSubmitCb = null; };

  // Acceso al body para leer inputs.
  Modal.body = () => (root ? root.querySelector('#modal-body') : null);

  window.App.Modal = Modal;
})();
