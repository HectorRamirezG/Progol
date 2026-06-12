// Sincronización con Supabase (REST). Push debounced + pull periódico.
// Tabla esperada en Supabase:
//   create table app_state ( slot text primary key, data jsonb not null, updated_at timestamptz default now() );
//   alter table app_state enable row level security;
//   create policy "anon all" on app_state for all to anon using (true) with check (true);
window.App = window.App || {};

(() => {
  'use strict';

  const CFG_KEY = 'progol-cloud.v1';
  const DEFAULT_SLOT = 'default';
  const PUSH_DEBOUNCE_MS = 900;
  const PULL_INTERVAL_MS = 30000;
  const REQUEST_TIMEOUT_MS = 6000;
  const SUPPRESS_PUSH_AFTER_PULL_MS = 600;

  // Config por defecto: la app se auto-conecta al abrir sin pedir nada al usuario.
  // Cambiar aquí para apuntar a otro proyecto o desactivar (poner null).
  const DEFAULT_CONFIG = {
    url: 'https://naxdlainnnkyctcisnew.supabase.co',
    key: 'sb_publishable_UviL4QyL2c1Fiy5Dje5UkQ_se2lCZWB',
    slot: 'default'
  };

  const listeners = new Set();
  let config = null;            // { url, key, slot }
  let status = 'disconnected';  // disconnected | connecting | ok | error
  let lastError = null;
  let lastSyncAt = null;
  let pushTimer = null;
  let pullTimer = null;
  let suppressPushUntil = 0;
  let inflightPush = false;

  // Carga config desde localStorage.
  const loadConfig = () => {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (!raw) return null;
      const c = JSON.parse(raw);
      if (!c.url || !c.key) return null;
      c.url = c.url.replace(/\/+$/, '');
      c.slot = c.slot || DEFAULT_SLOT;
      return c;
    } catch { return null; }
  };

  // Persiste config.
  const saveConfig = (c) => {
    if (c) localStorage.setItem(CFG_KEY, JSON.stringify(c));
    else localStorage.removeItem(CFG_KEY);
  };

  // Notifica cambio de estado a suscriptores UI.
  const setStatus = (s, err = null) => {
    status = s;
    lastError = err;
    listeners.forEach(fn => { try { fn(getStatus()); } catch (e) { console.error(e); } });
  };

  // Snapshot consumible por la UI.
  const getStatus = () => ({
    connected: !!config,
    status,
    lastError,
    lastSyncAt,
    slot: config?.slot || null,
    urlHost: config ? new URL(config.url).host : null,
    urlFull: config?.url || null,
    key: config?.key || null
  });

  // Construye headers Supabase REST.
  const headers = () => ({
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
  });

  // Fetch con timeout.
  const tfetch = (url, opts = {}) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
  };

  // GET el documento remoto del slot actual.
  const pull = async () => {
    if (!config) return null;
    setStatus('connecting');
    try {
      const url = `${config.url}/rest/v1/app_state?slot=eq.${encodeURIComponent(config.slot)}&select=*`;
      const res = await tfetch(url, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const rows = await res.json();
      lastSyncAt = new Date().toISOString();
      setStatus('ok');
      return rows[0] || null; // { slot, data, updated_at } | null
    } catch (e) {
      setStatus('error', e.message || String(e));
      return null;
    }
  };

  // UPSERT del documento remoto.
  const push = async (state) => {
    if (!config) return false;
    if (Date.now() < suppressPushUntil) return false;
    if (inflightPush) return false;
    inflightPush = true;
    setStatus('connecting');
    try {
      const body = JSON.stringify([{
        slot: config.slot,
        data: state,
        updated_at: new Date().toISOString()
      }]);
      const url = `${config.url}/rest/v1/app_state?on_conflict=slot`;
      const res = await tfetch(url, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      lastSyncAt = new Date().toISOString();
      setStatus('ok');
      return true;
    } catch (e) {
      setStatus('error', e.message || String(e));
      return false;
    } finally {
      inflightPush = false;
    }
  };

  // Encola push con debounce (se llama desde Store.save).
  const pushDebounced = (state) => {
    if (!config) return;
    if (Date.now() < suppressPushUntil) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => push(state), PUSH_DEBOUNCE_MS);
  };

  // Compara timestamps; si el remoto es más nuevo, aplica al Store.
  const pullAndApply = async () => {
    const row = await pull();
    if (!row || !row.data) return false;
    const localState = window.App.Store.get();
    const localTs = localState?._updatedAt ? Date.parse(localState._updatedAt) : 0;
    const remoteTs = row.updated_at ? Date.parse(row.updated_at) : 0;
    if (remoteTs > localTs) {
      suppressPushUntil = Date.now() + SUPPRESS_PUSH_AFTER_PULL_MS;
      window.App.Store.applyRemote(row.data);
      return true;
    }
    return false;
  };

  // Inicia polling periódico (también pull al volver al tab).
  const startPolling = () => {
    stopPolling();
    pullTimer = setInterval(() => {
      if (document.visibilityState === 'visible') pullAndApply();
    }, PULL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);
  };

  const stopPolling = () => {
    if (pullTimer) clearInterval(pullTimer);
    pullTimer = null;
    document.removeEventListener('visibilitychange', onVisibility);
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && config) pullAndApply();
  };

  // Conecta con config nueva: guarda, hace pull, y si no hay remoto sube el local.
  const connect = async ({ url, key, slot }) => {
    config = { url: (url || '').trim().replace(/\/+$/, ''), key: (key || '').trim(), slot: (slot || DEFAULT_SLOT).trim() };
    if (!config.url || !config.key) {
      config = null; setStatus('disconnected', 'URL o key vacíos'); return false;
    }
    saveConfig(config);
    setStatus('connecting');
    const remote = await pull();
    if (status === 'error') return false;
    if (remote && remote.data) {
      const localState = window.App.Store.get();
      const localTs = localState?._updatedAt ? Date.parse(localState._updatedAt) : 0;
      const remoteTs = remote.updated_at ? Date.parse(remote.updated_at) : 0;
      if (remoteTs >= localTs) {
        suppressPushUntil = Date.now() + SUPPRESS_PUSH_AFTER_PULL_MS;
        window.App.Store.applyRemote(remote.data);
      } else {
        await push(window.App.Store.get());
      }
    } else {
      await push(window.App.Store.get());
    }
    startPolling();
    return true;
  };

  // Desconecta y limpia config.
  const disconnect = () => {
    stopPolling();
    clearTimeout(pushTimer);
    config = null;
    saveConfig(null);
    setStatus('disconnected');
  };

  // Suscribe cambios de estado de sync.
  const subscribe = (fn) => { listeners.add(fn); fn(getStatus()); return () => listeners.delete(fn); };

  // Codifica/decodifica config compacta para compartir entre dispositivos.
  const encodeConfig = () => {
    if (!config) return '';
    return btoa(unescape(encodeURIComponent(JSON.stringify(config))));
  };
  const decodeConfig = (str) => {
    try { return JSON.parse(decodeURIComponent(escape(atob(str.trim())))); }
    catch { return null; }
  };

  // Bootstrap: usa config guardada o la DEFAULT_CONFIG embebida.
  const autoStart = async () => {
    const saved = loadConfig() || (DEFAULT_CONFIG && DEFAULT_CONFIG.url && DEFAULT_CONFIG.key ? { ...DEFAULT_CONFIG } : null);
    if (!saved) return;
    config = saved;
    setStatus('connecting');
    await pullAndApply();
    startPolling();
  };

  const isConnected = () => !!config;

  window.App.CloudSync = {
    connect, disconnect, pullAndApply, pushDebounced, push,
    subscribe, isConnected, getStatus,
    encodeConfig, decodeConfig, autoStart
  };
})();
