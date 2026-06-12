// Bootstrap: carga estado, conecta eventos globales, dispara primer render.
(() => {
  'use strict';

  const { Store, Render, Editor, Backend, Utils } = window.App;

  // IDs DOM por pestaña.
  const TABS = {
    progol:      { table: 'table-progol',      summary: 'summary-progol',      bars: 'chart-progol-bars',      pie: 'chart-progol-pie' },
    revancha:    { table: 'table-revancha',    summary: 'summary-revancha',    bars: 'chart-revancha-bars',    pie: 'chart-revancha-pie' },
    mediasemana: { table: 'table-mediasemana', summary: 'summary-mediasemana', bars: 'chart-mediasemana-bars', pie: 'chart-mediasemana-pie' }
  };

  // Default de partidos por tipo.
  const DEFAULT_N = { progol: 14, revancha: 7, mediasemana: 9, custom: 14 };

  // Repinta todo en cambio del store.
  const renderAll = () => {
    Object.entries(TABS).forEach(([tipo, ids]) => Render.tab(tipo, ids));
    Editor.render();
  };

  // Cambia de pestaña.
  const switchTab = (name) => {
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  };

  // Descarga JSON.
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(Store.get(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `progol-tracker-${Utils.today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    Utils.toast('Respaldo descargado', 'success');
  };

  // Importa JSON desde archivo.
  const importJSON = (file) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      return Utils.toast('Solo archivos .json', 'error');
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { Store.replace(JSON.parse(ev.target.result)); Utils.toast('Datos restaurados', 'success'); }
      catch (err) { Utils.toast('Error al importar: ' + err.message, 'error'); }
    };
    reader.readAsText(file);
  };

  // Restaura datos base.
  const restoreSeed = () => {
    if (!Utils.confirm('¿Borrar TODO y volver a los datos originales?')) return;
    Store.reset();
    Utils.toast('Datos restaurados', 'success');
  };

  // Crea concurso desde form rápido.
  const createConcursoFromForm = () => {
    const nombre = document.getElementById('new-concurso-nombre').value.trim();
    const tipo   = document.getElementById('new-concurso-tipo').value;
    const n      = document.getElementById('new-concurso-n').value || DEFAULT_N[tipo];
    Store.createConcurso({ nombre, tipo, n });
    document.getElementById('new-concurso-nombre').value = '';
    Utils.toast('Concurso creado', 'success');
  };

  // Drag&drop para importar.
  const wireDropzone = () => {
    const dz = document.getElementById('dropzone'); if (!dz) return;
    ['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation(); dz.classList.add('drag-over');
    }));
    ['dragleave','drop'].forEach(ev => dz.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag-over');
    }));
    dz.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) importJSON(f);
    });
  };

  // Conecta UI global.
  const wireUI = () => {
    document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    document.getElementById('btn-refresh').addEventListener('click', renderAll);
    document.getElementById('btn-export').addEventListener('click', exportJSON);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
    document.getElementById('file-import').addEventListener('change', (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; });
    document.getElementById('btn-restore').addEventListener('click', restoreSeed);
    document.getElementById('btn-new-concurso').addEventListener('click', createConcursoFromForm);

    document.getElementById('btn-fetch-next').addEventListener('click', Backend.fetchNextProgol);
    document.getElementById('btn-suggest').addEventListener('click', Backend.suggestPicks);

    document.getElementById('new-concurso-tipo').addEventListener('change', (e) => {
      document.getElementById('new-concurso-n').value = DEFAULT_N[e.target.value] || 14;
    });

    wireDropzone();
  };

  const init = () => {
    Store.load();
    Store.subscribe(renderAll);
    wireUI();
    renderAll();
    Utils.refreshIcons();
    Backend.ping();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
