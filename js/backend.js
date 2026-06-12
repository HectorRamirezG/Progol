// Cliente del backend FastAPI (opcional): health, fetch próximo Progol, sugerencias.
window.App = window.App || {};

(() => {
  'use strict';

  const URL = 'http://127.0.0.1:8765';
  const { Store, Utils } = window.App;
  const Backend = {};

  // Ping con timeout corto. Solo muestra el badge si el backend responde (silencioso si no).
  Backend.ping = async () => {
    const badge = document.getElementById('backend-status'); if (!badge) return false;
    try {
      const r = await fetch(`${URL}/health`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) {
        badge.innerHTML = '<i data-lucide="circle-check"></i> <span class="label">Backend local</span>';
        badge.className = 'badge badge-online';
        Utils.refreshIcons();
        return true;
      }
    } catch (_) { /* sin backend: lo dejamos oculto */ }
    badge.className = 'badge badge-offline hidden';
    return false;
  };

  // Trae próximos partidos y opcionalmente crea concurso.
  Backend.fetchNextProgol = async () => {
    const out = document.getElementById('assistant-output');
    out.textContent = 'Consultando backend…';
    try {
      const r = await fetch(`${URL}/next-progol`); if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      out.textContent = JSON.stringify(data, null, 2);
      if (Array.isArray(data.partidos) && data.partidos.length && Utils.confirm(`Se encontraron ${data.partidos.length} partidos. ¿Crear concurso?`)) {
        const tipo = data.partidos.length === 7 ? 'revancha' : 'progol';
        Store.createConcursoFromPartidos({ nombre: data.nombre, tipo, partidos: data.partidos });
        Utils.toast('Concurso creado desde backend', 'success');
      }
    } catch (e) {
      out.textContent = `❌ Backend no disponible.\nEjecuta:  python run.py\n\n${e.message}`;
    }
  };

  // Solicita sugerencias para el primer concurso.
  Backend.suggestPicks = async () => {
    const out = document.getElementById('assistant-output');
    const c = Store.get().concursos[0];
    if (!c) { out.textContent = 'No hay concursos.'; return; }
    out.textContent = 'Pidiendo probabilidades al backend…';
    try {
      const r = await fetch(`${URL}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partidos: c.partidos.map(p => ({ local: p.local, visitante: p.visitante })) })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      out.textContent = JSON.stringify(await r.json(), null, 2);
    } catch (e) {
      out.textContent = `❌ Backend no disponible.\nEjecuta:  python run.py\n\n${e.message}`;
    }
  };

  window.App.Backend = Backend;
})();
