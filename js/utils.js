// Helpers genéricos: namespaces, escape, clones, toast, icons, IDs, formatos.
window.App = window.App || {};

(() => {
  'use strict';

  const Utils = {};

  // Escapa HTML para evitar inyección al renderear con innerHTML.
  Utils.escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  // Alias para legibilidad en atributos.
  Utils.escapeAttr = Utils.escapeHtml;

  // Clon profundo simple (JSON-safe).
  Utils.deepClone = (o) => JSON.parse(JSON.stringify(o));

  // Genera un ID único corto.
  Utils.uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // Devuelve la fecha de hoy en formato YYYY-MM-DD.
  Utils.today = () => new Date().toISOString().slice(0, 10);

  // Formatea YYYY-MM-DD a "01-jun-2026" para UI.
  const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  Utils.fmtFecha = (iso) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
    const [y, m, d] = iso.split('-');
    return `${d}-${MESES[+m - 1]}-${y}`;
  };

  // Toast no bloqueante.
  let _toastTimer = null;
  Utils.toast = (msg, kind = '') => {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show ' + kind;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => (t.className = 'toast'), 2800);
  };

  // Redibuja los iconos Lucide tras inyectar HTML dinámico.
  Utils.refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  // Confirm bonito (usa confirm nativo por simplicidad — sin libs extra).
  Utils.confirm = (msg) => window.confirm(msg);

  window.App.Utils = Utils;
})();
