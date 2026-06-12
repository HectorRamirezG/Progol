// BD/Configuración: gestiona SOLO la plantilla (partidos). Boletos se editan desde su pestaña.
window.App = window.App || {};

(() => {
  'use strict';

  const { Store, Utils } = window.App;
  const OPTIONS = ['Pendiente', 'L', 'E', 'V'];
  const TAB_BY_TIPO = { progol: 'progol', revancha: 'revancha', mediasemana: 'mediasemana' };
  const Editor = {};
  const collapsed = new Set();

  Editor.render = () => {
    const root = document.getElementById('editor-root'); if (!root) return;
    const state = Store.get();
    if (!state.concursos.length) {
      root.innerHTML = `
        <div class="empty">
          <i data-lucide="inbox"></i>
          <p>No hay concursos. Crea uno arriba.</p>
        </div>`;
      Utils.refreshIcons();
      return;
    }
    root.innerHTML = `
      <div class="section-title-row">
        <h3><i data-lucide="layout-template"></i> Plantillas de concurso</h3>
        <span class="muted">Edita partidos y resultados. Los boletos se gestionan desde cada pestaña.</span>
      </div>
      ${state.concursos.map(renderConcurso).join('')}
    `;
    wire(root);
    Utils.refreshIcons();
  };

  // Card compacta por concurso.
  const renderConcurso = (c) => {
    const isCol = collapsed.has(c.id);
    return `
      <div class="editor-concurso" data-id="${c.id}">
        <div class="editor-header">
          <button class="btn btn-icon collapse-toggle" data-act="toggle" title="Colapsar/expandir">
            <i data-lucide="${isCol ? 'chevron-right' : 'chevron-down'}"></i>
          </button>
          <input class="concurso-name" type="text" data-act="rename" value="${Utils.escapeAttr(c.nombre)}" />
          <span class="pill pill-tipo">${c.tipo}</span>
          <span class="pill pill-count">${c.partidos.length} partidos</span>
          <span class="pill pill-ok">${c.boletos.length} boletos</span>
          <button class="btn btn-link" data-act="go-tab" title="Ir a la pestaña">
            <i data-lucide="external-link"></i> Ver pestaña
          </button>
          <button class="btn btn-danger" data-act="del-concurso" title="Eliminar concurso">
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        <div class="editor-body" ${isCol ? 'hidden' : ''}>
          <table class="editor-table">
            <thead>
              <tr>
                <th style="width:40px;">#</th>
                <th>Local</th>
                <th>Visitante</th>
                <th style="width:140px;">Resultado real</th>
                <th style="width:50px;"></th>
              </tr>
            </thead>
            <tbody>
              ${c.partidos.map((p, pi) => `
                <tr data-pi="${pi}">
                  <td class="center">${p.n}</td>
                  <td><span class="editor-team">${window.App.Flags ? window.App.Flags.imgFor(p.local) : ''}<input type="text" data-act="partido" data-field="local" value="${Utils.escapeAttr(p.local)}" /></span></td>
                  <td><span class="editor-team">${window.App.Flags ? window.App.Flags.imgFor(p.visitante) : ''}<input type="text" data-act="partido" data-field="visitante" value="${Utils.escapeAttr(p.visitante)}" /></span></td>
                  <td>
                    <select data-act="partido" data-field="resultado">
                      ${OPTIONS.map(o => `<option value="${o}" ${p.resultado===o?'selected':''}>${o}</option>`).join('')}
                    </select>
                  </td>
                  <td class="center">
                    <button class="btn btn-danger btn-icon" data-act="del-partido" title="Eliminar partido"><i data-lucide="x"></i></button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
          <div class="boleto-actions">
            <button class="btn" data-act="add-partido"><i data-lucide="plus"></i> Agregar partido</button>
          </div>
        </div>
      </div>`;
  };

  const wire = (root) => {
    root.querySelectorAll('.editor-concurso').forEach(box => {
      const cid = box.dataset.id;
      box.addEventListener('input', (e) => handleInput(cid, e));
      box.addEventListener('change', (e) => handleInput(cid, e));
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]'); if (!btn) return;
        handleClick(cid, btn);
      });
    });
  };

  const handleInput = (cid, e) => {
    const el = e.target;
    const act = el.dataset.act; if (!act) return;
    if (act === 'rename')  return Store.renameConcurso(cid, el.value);
    if (act === 'partido') {
      const pi = +el.closest('tr').dataset.pi;
      return Store.updatePartido(cid, pi, { [el.dataset.field]: el.value });
    }
  };

  const handleClick = (cid, btn) => {
    const act = btn.dataset.act;

    if (act === 'toggle') {
      collapsed.has(cid) ? collapsed.delete(cid) : collapsed.add(cid);
      Editor.render();
      return;
    }
    if (act === 'go-tab') {
      const c = Store.getById(cid);
      const tab = TAB_BY_TIPO[c.tipo] || 'bd';
      document.querySelector(`.tab[data-tab="${tab}"]`)?.click();
      return;
    }
    if (act === 'del-concurso') {
      const c = Store.getById(cid);
      if (Utils.confirm(`¿Eliminar concurso "${c.nombre}" y sus ${c.boletos.length} boletos?`)) {
        Store.deleteConcurso(cid);
        Utils.toast('Concurso eliminado', 'success');
      }
      return;
    }
    if (act === 'add-partido') return Store.addPartido(cid);
    if (act === 'del-partido') {
      const pi = +btn.closest('tr').dataset.pi;
      if (Utils.confirm('¿Eliminar este partido?')) Store.deletePartido(cid, pi);
    }
  };

  window.App.Editor = Editor;
})();
