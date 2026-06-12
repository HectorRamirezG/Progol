// Lógica pura de cálculo (sin DOM): aciertos, fallas, pendientes.
window.App = window.App || {};

(() => {
  'use strict';

  const Stats = {};

  // Estatus de un pick vs resultado real: 'ok' | 'bad' | 'pend'.
  Stats.statusFor = (real, pick) => {
    if (!real || real === 'Pendiente') return 'pend';
    return real === pick ? 'ok' : 'bad';
  };

  // Glyph compacto para celdas.
  Stats.statusGlyph = (s) => (s === 'ok' ? '✓' : s === 'bad' ? '✕' : '');

  // Conteo por boleto.
  Stats.tallyBoleto = (concurso, boleto) => {
    let ok = 0, bad = 0, pend = 0;
    concurso.partidos.forEach((p, i) => {
      const s = Stats.statusFor(p.resultado, boleto.picks[i]);
      if (s === 'ok') ok++; else if (s === 'bad') bad++; else pend++;
    });
    return { ok, bad, pend, total: concurso.partidos.length };
  };

  // Partidos pendientes del concurso.
  Stats.tallyPendientes = (concurso) =>
    concurso.partidos.filter(p => !p.resultado || p.resultado === 'Pendiente').length;

  window.App.Stats = Stats;
})();
