// Heurística local de probabilidad: L/E/V por partido. Sin backend.
window.App = window.App || {};

(() => {
  'use strict';

  const Probs = {};

  // Lista corta de equipos "fuertes" → bonus al ganar.
  const FUERTES = new Set([
    'brasil','argentina','francia','inglaterra','alemania','españa','portugal',
    'países bajos','holanda','italia','bélgica','uruguay','croacia','marruecos',
    'estados unidos','e.u.a.','japón','méxico','colombia','suecia','dinamarca',
    'real madrid','barcelona','manchester city','liverpool','bayern','psg',
    'manchester united','chelsea','arsenal','atlético madrid','juventus','milan','inter'
  ]);

  // Normaliza nombre (lowercase, sin acentos en exceso, trim).
  const norm = (s) => String(s || '').toLowerCase().trim();

  // Devuelve {L, E, V} sumando 100.
  Probs.compute = (local, visitante) => {
    let L = 40, E = 28, V = 32; // base con ventaja local
    const l = norm(local), v = norm(visitante);
    if (FUERTES.has(l)) { L += 12; V -= 6; E -= 6; }
    if (FUERTES.has(v)) { V += 12; L -= 6; E -= 6; }
    // Saneo de mínimos.
    L = Math.max(8, L); E = Math.max(8, E); V = Math.max(8, V);
    const s = L + E + V;
    return { L: Math.round(L * 100 / s), E: Math.round(E * 100 / s), V: Math.round(V * 100 / s) };
  };

  // Probabilidad asignada a un pick concreto.
  Probs.forPick = (local, visitante, pick) => {
    const p = Probs.compute(local, visitante);
    return p[pick] || 0;
  };

  // Color según probabilidad (verde alto, ámbar medio, rojo bajo).
  Probs.color = (pct) => {
    if (pct >= 55) return '#10b981';  // verde menta
    if (pct >= 38) return '#8b5cf6';  // violeta lavanda (sin naranja)
    return '#ef4444';                  // rojo coral
  };

  // HTML compacto de barra con %.
  Probs.bar = (pct) => `
    <div class="prob-bar" title="Probabilidad estimada ${pct}%">
      <div class="prob-fill" style="width:${pct}%; background:${Probs.color(pct)};"></div>
      <span class="prob-text">${pct}%</span>
    </div>
  `;

  window.App.Probs = Probs;
})();
