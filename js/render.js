// Render principal: tablas + KPIs + charts + empty state + acciones boleto.
window.App = window.App || {};

(() => {
  'use strict';

  const { Store, Stats, Utils, Charts, Probs } = window.App;
  const OPTIONS = ['Pendiente', 'L', 'E', 'V'];

  // Labels amigables por tipo (sin mostrar IDs).
  const LABEL = { progol: 'Progol Principal', revancha: 'Revancha', mediasemana: 'Progol Media Semana' };
  const N_DEFAULT = { progol: 14, revancha: 7, mediasemana: 9 };

  const Render = {};

  // Renderiza la pestaña completa para un tipo.
  Render.tab = (tipo, ids) => {
    const list = Store.listByTipo(tipo);
    const c = Store.getByTipo(tipo);
    const panel = document.getElementById('tab-' + tipo);
    if (!panel) return;

    // Si no hay concurso de este tipo, muestra empty state.
    if (!c) {
      renderEmpty(panel, tipo);
      return;
    }
    // Si veníamos del empty, restauramos las secciones originales.
    ensureSectionsVisible(panel, tipo, ids);
    renderJornadaSelector(panel, tipo, list, c.id);
    const table = document.getElementById(ids.table);
    const summary = document.getElementById(ids.summary);
    renderTable(table, c);
    renderSummary(summary, c);
    Charts.renderBars(ids.bars, c, Stats.tallyBoleto);
    Charts.renderPie(ids.pie, c, Stats.tallyBoleto);
  };

  // Si hay más de 1 concurso del mismo tipo, muestra selector arriba.
  const renderJornadaSelector = (panel, tipo, list, activeId) => {
    const host = panel.querySelector('.jornada-bar');
    if (!host) return;
    const pills = list.length > 1 ? `
      <label class="jornada-label"><i data-lucide="layers"></i> Jornada:</label>
      <div class="jornada-pills">
        ${list.map(c => `
          <button class="jornada-pill ${c.id === activeId ? 'active' : ''}" data-jornada="${c.id}">
            ${Utils.escapeHtml(c.nombre)}
          </button>
        `).join('')}
      </div>
    ` : '';
    host.innerHTML = `
      ${pills}
      <div class="legend" title="¿Qué significa cada columna?">
        <span><i data-lucide="sparkles"></i> <strong>Sugerido</strong> = pick más probable</span>
        <span><i data-lucide="percent"></i> <strong>Prob. de tu pick</strong> = qué tan probable es lo que apostaste</span>
        <span><i data-lucide="check-circle-2"></i> <strong>Estatus</strong> = ✓ acierto · ✕ fallo · — pendiente</span>
      </div>
    `;
    host.querySelectorAll('[data-jornada]').forEach(btn => {
      btn.addEventListener('click', () => Store.setActive(tipo, btn.dataset.jornada));
    });
    Utils.refreshIcons();
  };

  // Estado vacío: CTA para crear concurso de este tipo.
  const renderEmpty = (panel, tipo) => {
    panel.innerHTML = `
      <div class="panel-header">
        <h2><i data-lucide="ticket" class="h-icon"></i> ${LABEL[tipo] || tipo}</h2>
      </div>
      <div class="empty empty-cta">
        <i data-lucide="inbox"></i>
        <h3>No tienes concurso de ${LABEL[tipo] || tipo}</h3>
        <p class="muted">Crea uno con ${N_DEFAULT[tipo] || 14} partidos y empieza a capturar tus boletos.</p>
        <button class="btn btn-primary" data-create-tipo="${tipo}">
          <i data-lucide="plus"></i> Crear concurso ${LABEL[tipo] || tipo}
        </button>
      </div>
    `;
    panel.querySelector('[data-create-tipo]').addEventListener('click', (e) => {
      const t = e.currentTarget.dataset.createTipo;
      Store.createConcurso({ nombre: LABEL[t] || t, tipo: t, n: N_DEFAULT[t] || 14 });
      Utils.toast(`${LABEL[t]} creado`, 'success');
    });
    Utils.refreshIcons();
  };

  // Restaura el HTML original del tab si vino del empty state.
  const ensureSectionsVisible = (panel, tipo, ids) => {
    if (panel.querySelector(`#${ids.table}`)) {
      // Asegura barra de jornada incluso en panel ya inicializado.
      if (!panel.querySelector('.jornada-bar')) {
        const bar = document.createElement('div');
        bar.className = 'jornada-bar';
        panel.insertBefore(bar, panel.querySelector('.charts-row'));
      }
      return;
    }
    panel.innerHTML = `
      <div class="panel-header">
        <h2><i data-lucide="ticket" class="h-icon"></i> ${LABEL[tipo] || tipo}</h2>
        <div class="summary" id="${ids.summary}"></div>
      </div>
      <div class="jornada-bar"></div>
      <div class="charts-row">
        <div class="chart-card"><h4>Aciertos por boleto</h4><canvas id="${ids.bars}"></canvas></div>
        <div class="chart-card"><h4>Distribución</h4><canvas id="${ids.pie}"></canvas></div>
      </div>
      <div class="table-wrap"><table id="${ids.table}" class="data-table"></table></div>
    `;
  };

  // Tabla con resultado real, sugerencia, picks, probabilidad y estatus.
  const renderTable = (table, c) => {
    const { Flags } = window.App;
    const head = `
      <thead>
        <tr>
          <th>#</th>
          <th>Partido</th>
          <th class="sub" title="Captura aquí el marcador final cuando termine">Real</th>
          <th class="sub" title="Pick con mayor probabilidad estimada (heurística básica) y su porcentaje">Sugerido</th>
          ${c.boletos.map(b => `
            <th class="sub" title="Lo que apostaste en este boleto">${Utils.escapeHtml(b.nombre)}<br><small>${Utils.escapeHtml(Utils.fmtFecha(b.fecha))}</small></th>
            <th class="sub" title="Probabilidad estimada de TU pick (no del sugerido)">Prob. de tu pick</th>
            <th class="sub" title="✓ acertaste · ✕ fallaste · — pendiente">Estatus</th>
          `).join('')}
        </tr>
      </thead>
    `;

    const body = `<tbody>${c.partidos.map((p, i) => {
      const probs = Probs.compute(p.local, p.visitante);
      const sug = ['L','E','V'].reduce((a, k) => probs[k] > probs[a] ? k : a, 'L');
      const cells = c.boletos.map(b => {
        const pick = b.picks[i] || '';
        const s = Stats.statusFor(p.resultado, pick);
        const pct = probs[pick] || 0;
        return `
          <td class="col-pick">${Utils.escapeHtml(pick)}</td>
          <td class="col-prob">${Probs.bar(pct)}</td>
          <td class="col-status status-${s}">
            ${s === 'pend' ? '' : `<span class="status-glyph">${Stats.statusGlyph(s)}</span>`}
          </td>
        `;
      }).join('');
      return `
        <tr>
          <td class="col-num">${p.n}</td>
          <td class="col-partido">
            <span class="team">${Flags ? Flags.imgFor(p.local) : ''}<span>${Utils.escapeHtml(p.local)}</span></span>
            <span class="vs">vs</span>
            <span class="team">${Flags ? Flags.imgFor(p.visitante) : ''}<span>${Utils.escapeHtml(p.visitante)}</span></span>
          </td>
          <td class="col-real">
            <select class="real-select" data-concurso="${c.id}" data-idx="${i}">
              ${OPTIONS.map(o => `<option value="${o}" ${p.resultado === o ? 'selected' : ''}>${o === 'Pendiente' ? '—' : o}</option>`).join('')}
            </select>
          </td>
          <td class="col-suggest" title="Pick más probable según los equipos">
            <span class="suggest-pill suggest-${sug}">${sug} · ${probs[sug]}%</span>
          </td>
          ${cells}
        </tr>
      `;
    }).join('')}</tbody>`;

    table.innerHTML = head + body;

    table.querySelectorAll('.real-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        Store.setResultado(e.target.dataset.concurso, +e.target.dataset.idx, e.target.value);
      });
    });
  };

  // KPIs por boleto con botones editar/eliminar inline + Nuevo boleto.
  const renderSummary = (summary, c) => {
    const pend = Stats.tallyPendientes(c);
    const total = c.partidos.length;
    const kpis = c.boletos.map(b => {
      const t = Stats.tallyBoleto(c, b);
      const score = (t.ok + t.bad) ? Math.round(t.ok * 100 / (t.ok + t.bad)) : 0;
      return `
        <div class="kpi kpi-ok kpi-boleto">
          <div class="kpi-top">
            <span class="kpi-label">${Utils.escapeHtml(b.nombre)}</span>
            <div class="kpi-actions">
              <button class="icon-btn" data-edit="${b.id}" title="Editar"><i data-lucide="pencil"></i></button>
              <button class="icon-btn icon-btn-danger" data-del="${b.id}" title="Eliminar"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
          <span class="kpi-value">${t.ok} <small>/ ${total}</small></span>
          <span class="kpi-sub">${t.bad} fallos · ${t.pend} pend. · ${score}% efectividad</span>
        </div>
      `;
    }).join('');

    summary.innerHTML = kpis + `
      <div class="kpi kpi-pend">
        <span class="kpi-label">Pendientes</span>
        <span class="kpi-value">${pend}</span>
        <span class="kpi-sub">por jugar</span>
      </div>
      <button class="btn btn-primary kpi-action" data-add-boleto="${c.id}">
        <i data-lucide="plus"></i> Nuevo boleto
      </button>
    `;

    // Wire acciones.
    summary.querySelector('[data-add-boleto]').addEventListener('click', () => window.App.AddBoleto.open(c.id));
    summary.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => window.App.AddBoleto.edit(c.id, btn.dataset.edit));
    });
    summary.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('¿Eliminar este boleto?')) {
          Store.deleteBoleto(c.id, btn.dataset.del);
          Utils.toast('Boleto eliminado', 'success');
        }
      });
    });

    Utils.refreshIcons();
  };

  window.App.Render = Render;
})();
