// Modal nuevo/editar boleto: chips L/E/V, bulk fill y guardado.
window.App = window.App || {};

(() => {
  'use strict';

  const { Store, Modal, Utils, Probs } = window.App;
  const AddBoleto = {};
  let draft = null;
  let mode = 'new'; // 'new' | 'edit'

  // Abre el modal en modo "nuevo".
  AddBoleto.open = (concursoId) => {
    const c = Store.getById(concursoId); if (!c) return;
    mode = 'new';
    draft = {
      concursoId,
      boletoId: null,
      nombre: `Boleto ${c.boletos.length + 1}`,
      fecha: Utils.today(),
      picks: c.partidos.map(() => 'L')
    };
    openModal(c, 'Nuevo boleto');
  };

  // Abre el modal en modo "editar" copiando del store.
  AddBoleto.edit = (concursoId, boletoId) => {
    const c = Store.getById(concursoId); if (!c) return;
    const b = c.boletos.find(x => x.id === boletoId); if (!b) return;
    mode = 'edit';
    draft = {
      concursoId,
      boletoId,
      nombre: b.nombre,
      fecha: b.fecha || Utils.today(),
      picks: b.picks.slice()
    };
    openModal(c, 'Editar boleto');
  };

  // Apertura común del modal.
  const openModal = (c, title) => {
    Modal.open({
      title: `${title} — ${c.nombre}`,
      body: buildBody(c),
      actions: [
        { id: 'cancel', label: 'Cancelar', onClick: Modal.close },
        { id: 'save',   label: 'Guardar', kind: 'btn-primary', onClick: () => save() }
      ]
    });
    wireInputs();
  };

  // Cuerpo: cabecera + filas con probabilidad.
  const buildBody = (c) => `
    <div class="ab-head">
      <label class="ab-field">
        <span>Nombre</span>
        <input id="ab-nombre" type="text" value="${Utils.escapeAttr(draft.nombre)}" />
      </label>
      <label class="ab-field">
        <span>Fecha</span>
        <input id="ab-fecha" type="date" value="${Utils.escapeAttr(draft.fecha)}" />
      </label>
      <div class="ab-bulk">
        <span class="muted">Llenar todo:</span>
        <button class="btn-chip" data-bulk="L">L</button>
        <button class="btn-chip" data-bulk="E">E</button>
        <button class="btn-chip" data-bulk="V">V</button>
      </div>
    </div>
    <div class="ab-grid">
      ${c.partidos.map((p, i) => {
        const probs = Probs.compute(p.local, p.visitante);
        return `
          <div class="ab-row" data-idx="${i}">
            <span class="ab-num">${p.n}</span>
            <span class="ab-match">${Utils.escapeHtml(p.local)} <small>vs</small> ${Utils.escapeHtml(p.visitante)}</span>
            <div class="ab-chips" role="radiogroup">
              ${['L','E','V'].map(o => `
                <button type="button" class="chip ${draft.picks[i] === o ? 'on' : ''}"
                        data-idx="${i}" data-val="${o}" title="Probabilidad ${probs[o]}%">
                  ${o} <small>${probs[o]}%</small>
                </button>
              `).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>
  `;

  // Listeners del modal.
  const wireInputs = () => {
    const body = Modal.body(); if (!body) return;
    body.querySelector('#ab-nombre').addEventListener('input', e => (draft.nombre = e.target.value));
    body.querySelector('#ab-fecha').addEventListener('input', e => (draft.fecha = e.target.value));

    body.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const idx = +chip.dataset.idx;
        const val = chip.dataset.val;
        draft.picks[idx] = val;
        body.querySelectorAll(`.chip[data-idx="${idx}"]`).forEach(c => c.classList.toggle('on', c.dataset.val === val));
      });
    });

    body.querySelectorAll('[data-bulk]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.bulk;
        draft.picks = draft.picks.map(() => val);
        body.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.val === val));
      });
    });
  };

  // Guarda según modo (nuevo o edición).
  const save = () => {
    const patch = { nombre: draft.nombre.trim() || 'Sin nombre', fecha: draft.fecha, picks: draft.picks };
    if (mode === 'edit') {
      Store.updateBoleto(draft.concursoId, draft.boletoId, patch);
      // updateBoleto no toca picks → los seteamos a mano.
      const c = Store.getById(draft.concursoId);
      const b = c.boletos.find(x => x.id === draft.boletoId);
      b.picks = draft.picks.slice();
      Store.save();
      Utils.toast('Boleto actualizado', 'success');
    } else {
      Store.addBoleto(draft.concursoId, patch);
      Utils.toast('Boleto agregado', 'success');
    }
    Modal.close();
  };

  window.App.AddBoleto = AddBoleto;
})();
