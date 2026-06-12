// Estado, persistencia (localStorage) y operaciones CRUD sobre concursos/boletos.
window.App = window.App || {};

(() => {
  'use strict';

  const KEY = 'progol-tracker.v1';
  const { deepClone, uid, today } = window.App.Utils;

  const Store = {};
  let state = null;
  const listeners = new Set();

  // Carga estado desde localStorage, o cae al SEED.
  Store.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = JSON.parse(raw);
    } catch (e) { console.warn('localStorage corrupto:', e); }
    if (!state) state = deepClone(window.SEED_DATA);
    migrate();
    return state;
  };

  // Migración: asegura que existan los tipos básicos copiándolos del SEED.
  const migrate = () => {
    let changed = false;
    const REQUIRED = ['progol', 'revancha', 'mediasemana'];
    REQUIRED.forEach(tipo => {
      if (!state.concursos.find(c => c.tipo === tipo)) {
        const seed = window.SEED_DATA.concursos.find(c => c.tipo === tipo);
        if (seed) { state.concursos.push(deepClone(seed)); changed = true; }
      }
    });
    if (changed) localStorage.setItem(KEY, JSON.stringify(state));
  };

  // Persiste y notifica. Marca timestamp para resolución de conflictos remoto.
  Store.save = () => {
    state._updatedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
    // Push remoto si la nube está conectada (no bloquea la UI).
    if (window.App.CloudSync && window.App.CloudSync.isConnected()) {
      window.App.CloudSync.pushDebounced(state);
    }
  };

  // Aplica estado venido del remoto: notifica pero NO dispara push (evita loop).
  Store.applyRemote = (next) => {
    if (!next || !Array.isArray(next.concursos)) return;
    state = next;
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  };

  // Devuelve referencia al state (no clonar para perf).
  Store.get = () => state;

  // Suscribe un listener para repintar cuando cambia el state.
  Store.subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  // Reemplaza todo el state (import).
  Store.replace = (next) => {
    if (!next || !Array.isArray(next.concursos)) throw new Error('Formato inválido');
    state = next;
    Store.save();
  };

  // Vuelve a los datos base.
  Store.reset = () => {
    state = deepClone(window.SEED_DATA);
    Store.save();
  };

  // Devuelve el primer concurso por tipo.
  Store.getByTipo = (tipo) => state.concursos.find(c => c.tipo === tipo);

  // Devuelve concurso por id.
  Store.getById = (id) => state.concursos.find(c => c.id === id);

  // Actualiza un campo de partido y notifica.
  Store.setResultado = (concursoId, idx, valor) => {
    const c = Store.getById(concursoId);
    if (!c) return;
    c.partidos[idx].resultado = valor;
    Store.save();
  };

  // Crea un concurso vacío.
  Store.createConcurso = ({ nombre, tipo, n }) => {
    n = Math.max(1, Math.min(30, parseInt(n, 10) || 14));
    const partidos = Array.from({ length: n }, (_, i) => ({
      n: i + 1, local: `Local ${i + 1}`, visitante: `Visitante ${i + 1}`, resultado: 'Pendiente'
    }));
    const c = {
      id: uid(tipo),
      tipo,
      nombre: nombre || `Nuevo ${tipo}`,
      partidos,
      boletos: [{
        id: uid('b'),
        nombre: 'Boleto 1',
        fecha: today(),
        picks: partidos.map(() => 'L')
      }]
    };
    state.concursos.push(c);
    Store.save();
    return c;
  };

  // Crea un concurso a partir de partidos importados (ej. scraper backend).
  Store.createConcursoFromPartidos = ({ nombre, tipo, partidos }) => {
    const c = {
      id: uid(tipo),
      tipo,
      nombre: nombre || `Nuevo ${tipo}`,
      partidos: partidos.map((p, i) => ({
        n: i + 1, local: p.local, visitante: p.visitante, resultado: 'Pendiente'
      })),
      boletos: [{
        id: uid('b'),
        nombre: 'Boleto 1',
        fecha: today(),
        picks: partidos.map(() => 'L')
      }]
    };
    state.concursos.push(c);
    Store.save();
    return c;
  };

  // Elimina concurso por id.
  Store.deleteConcurso = (id) => {
    state.concursos = state.concursos.filter(c => c.id !== id);
    Store.save();
  };

  // Renombra concurso.
  Store.renameConcurso = (id, nombre) => {
    const c = Store.getById(id); if (!c) return;
    c.nombre = nombre; Store.save();
  };

  // Edita un partido (local/visitante/resultado).
  Store.updatePartido = (concursoId, idx, patch) => {
    const c = Store.getById(concursoId); if (!c) return;
    Object.assign(c.partidos[idx], patch);
    Store.save();
  };

  // Agrega partido al final.
  Store.addPartido = (concursoId) => {
    const c = Store.getById(concursoId); if (!c) return;
    const n = c.partidos.length + 1;
    c.partidos.push({ n, local: `Local ${n}`, visitante: `Visitante ${n}`, resultado: 'Pendiente' });
    c.boletos.forEach(b => b.picks.push('L'));
    Store.save();
  };

  // Elimina partido y resincroniza numeración y picks.
  Store.deletePartido = (concursoId, idx) => {
    const c = Store.getById(concursoId); if (!c) return;
    c.partidos.splice(idx, 1);
    c.partidos.forEach((p, i) => (p.n = i + 1));
    c.boletos.forEach(b => b.picks.splice(idx, 1));
    Store.save();
  };

  // Agrega boleto al concurso (picks por defecto L o lo recibido).
  Store.addBoleto = (concursoId, { nombre, fecha, picks } = {}) => {
    const c = Store.getById(concursoId); if (!c) return null;
    const b = {
      id: uid('b'),
      nombre: nombre || `Boleto ${c.boletos.length + 1}`,
      fecha: fecha || today(),
      picks: picks && picks.length === c.partidos.length ? picks.slice() : c.partidos.map(() => 'L')
    };
    c.boletos.push(b);
    Store.save();
    return b;
  };

  // Elimina boleto por id.
  Store.deleteBoleto = (concursoId, boletoId) => {
    const c = Store.getById(concursoId); if (!c) return;
    c.boletos = c.boletos.filter(b => b.id !== boletoId);
    Store.save();
  };

  // Actualiza nombre/fecha de un boleto.
  Store.updateBoleto = (concursoId, boletoId, patch) => {
    const c = Store.getById(concursoId); if (!c) return;
    const b = c.boletos.find(x => x.id === boletoId); if (!b) return;
    Object.assign(b, patch);
    Store.save();
  };

  // Cambia un pick específico.
  Store.setPick = (concursoId, boletoId, idx, valor) => {
    const c = Store.getById(concursoId); if (!c) return;
    const b = c.boletos.find(x => x.id === boletoId); if (!b) return;
    b.picks[idx] = valor;
    Store.save();
  };

  window.App.Store = Store;
})();
