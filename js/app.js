// Bootstrap: carga estado, conecta eventos globales, dispara primer render.
(() => {
  'use strict';

  const { Store, Render, Editor, Backend, Utils, CloudSync } = window.App;

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

  // Refresca el chip de estado de la nube en el header.
  const renderCloudStatus = (s) => {
    const chip = document.getElementById('cloud-status'); if (!chip) return;
    const summary = document.getElementById('cloud-summary');
    const icons = { ok: 'cloud-check', connecting: 'cloud', error: 'cloud-alert', disconnected: 'cloud-off' };
    const labels = { ok: 'Sincronizado', connecting: 'Sincronizando…', error: 'Error nube', disconnected: 'Sin nube' };
    const cls = { ok: 'badge-online', connecting: 'badge-warn', error: 'badge-error', disconnected: 'badge-offline' };
    chip.className = 'badge ' + (cls[s.status] || 'badge-offline');
    chip.innerHTML = `<i data-lucide="${icons[s.status] || 'cloud-off'}"></i> <span class="label">${labels[s.status] || s.status}</span>`;
    chip.title = s.lastError ? `Error: ${s.lastError}` : (s.lastSyncAt ? `Última sync: ${new Date(s.lastSyncAt).toLocaleTimeString()}` : labels[s.status]);
    if (summary) {
      if (!s.connected) summary.innerHTML = 'No conectado.';
      else summary.innerHTML = `Conectado a <code>${Utils.escapeHtml(s.urlHost || '')}</code> · slot <code>${Utils.escapeHtml(s.slot || '')}</code>${s.lastSyncAt ? ' · última sync ' + new Date(s.lastSyncAt).toLocaleTimeString() : ''}`;
    }
    Utils.refreshIcons();
  };

  // Muestra modal con instrucciones SQL para crear la tabla en Supabase.
  const showCloudHelp = () => {
    if (!window.App.Modal) { Utils.toast('Modal no disponible', 'error'); return; }
    window.App.Modal.open({
      title: 'Configurar Supabase (1 minuto)',
      body: `
        <ol class="help-list">
          <li>Entra a <a href="https://supabase.com" target="_blank">supabase.com</a> y crea un proyecto gratis (Login con GitHub).</li>
          <li>En el panel izquierdo abre <strong>SQL Editor</strong> y ejecuta:
            <pre class="code-block">create table app_state (
  slot text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table app_state enable row level security;

create policy "anon all" on app_state
  for all to anon
  using (true) with check (true);</pre></li>
          <li>Ve a <strong>Project Settings &rarr; API</strong> y copia:
            <ul><li><strong>Project URL</strong> (https://xxx.supabase.co)</li><li><strong>anon public</strong> key</li></ul>
          </li>
          <li>Pégalos arriba en “URL” y “anon key” y haz <strong>Conectar</strong>.</li>
          <li>En tu celular, abre la misma URL del sitio y pulsa <strong>Pegar config</strong> con el código que copies en PC.</li>
        </ol>
      `,
      actions: [{ id: 'ok', label: 'Entendido', kind: 'btn-primary', onClick: () => window.App.Modal.close() }]
    });
  };

  // Conecta con los datos del form.
  const cloudConnect = async () => {
    const url = document.getElementById('cloud-url').value;
    const key = document.getElementById('cloud-key').value;
    const slot = document.getElementById('cloud-slot').value || 'default';
    if (!url || !key) return Utils.toast('Falta URL o key', 'error');
    Utils.toast('Conectando…', 'info');
    const ok = await CloudSync.connect({ url, key, slot });
    if (ok) Utils.toast('Conectado a la nube', 'success');
    else Utils.toast('Error al conectar: ' + (CloudSync.getStatus().lastError || ''), 'error');
  };

  // Conecta los handlers del card de nube.
  const wireCloud = () => {
    if (!CloudSync) return;
    CloudSync.subscribe(renderCloudStatus);
    // Pre-rellena inputs con el estado actual (o config default si nunca conectaste).
    const fillInputs = (s) => {
      const urlIn = document.getElementById('cloud-url');
      const keyIn = document.getElementById('cloud-key');
      const slotIn = document.getElementById('cloud-slot');
      if (urlIn && !urlIn.value) urlIn.value = s.urlFull || '';
      if (keyIn && !keyIn.value) keyIn.value = s.key || '';
      if (slotIn && !slotIn.value) slotIn.value = s.slot || 'default';
    };
    fillInputs(CloudSync.getStatus());
    document.getElementById('btn-cloud-connect').addEventListener('click', cloudConnect);
    document.getElementById('btn-cloud-disconnect').addEventListener('click', () => {
      CloudSync.disconnect(); Utils.toast('Desconectado', 'info');
    });
    document.getElementById('btn-cloud-sync').addEventListener('click', async () => {
      if (!CloudSync.isConnected()) return Utils.toast('Conecta primero', 'error');
      const applied = await CloudSync.pullAndApply();
      if (!applied) await CloudSync.push(Store.get());
      Utils.toast(applied ? 'Recibido del servidor' : 'Enviado al servidor', 'success');
    });
    document.getElementById('btn-cloud-help').addEventListener('click', showCloudHelp);
    document.getElementById('btn-cloud-copy').addEventListener('click', async () => {
      const code = CloudSync.encodeConfig();
      if (!code) return Utils.toast('No hay config para copiar', 'error');
      try { await navigator.clipboard.writeText(code); Utils.toast('Config copiada al portapapeles', 'success'); }
      catch { Utils.toast('No se pudo copiar: ' + code, 'error'); }
    });
    document.getElementById('btn-cloud-paste').addEventListener('click', async () => {
      let txt = '';
      try { txt = await navigator.clipboard.readText(); } catch {}
      if (!txt) txt = prompt('Pega el código de config aquí:') || '';
      const cfg = CloudSync.decodeConfig(txt);
      if (!cfg || !cfg.url || !cfg.key) return Utils.toast('Código inválido', 'error');
      document.getElementById('cloud-url').value = cfg.url;
      document.getElementById('cloud-key').value = cfg.key;
      document.getElementById('cloud-slot').value = cfg.slot || 'default';
      Utils.toast('Pegado. Pulsa Conectar.', 'success');
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
    wireCloud();
  };

  const init = () => {
    Store.load();
    Store.subscribe(renderAll);
    wireUI();
    renderAll();
    Utils.refreshIcons();
    Backend.ping();
    // Reconecta nube si hay config guardada (no bloquea el primer render).
    if (CloudSync) CloudSync.autoStart();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
