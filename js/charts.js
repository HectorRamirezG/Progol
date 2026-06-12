// Chart.js: gráficos por tipo. Cada chart vive en cache para destruirlo limpio.
window.App = window.App || {};

(() => {
  'use strict';

  const Charts = {};
  const cache = new Map();

  // Paleta consistente con el tema.
  const COLORS = {
    ok:    '#16a34a',
    bad:   '#dc2626',
    pend:  '#f59e0b',
    navy:  '#0f2a47',
    beige: '#e8dcb8'
  };

  // Configuración base reutilizable.
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeOutCubic' },
    plugins: {
      legend: { labels: { font: { family: 'Inter, system-ui, sans-serif', size: 11 }, color: '#374151' } },
      tooltip: {
        backgroundColor: COLORS.navy,
        padding: 10,
        cornerRadius: 6,
        titleFont: { size: 12 },
        bodyFont: { size: 12 }
      }
    }
  };

  // Destruye chart anterior si existe.
  const destroyIfExists = (canvasId) => {
    if (cache.has(canvasId)) {
      cache.get(canvasId).destroy();
      cache.delete(canvasId);
    }
  };

  // Barra: aciertos por boleto.
  Charts.renderBars = (canvasId, concurso, tally) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyIfExists(canvasId);

    const labels = concurso.boletos.map(b => b.nombre);
    const oks    = concurso.boletos.map(b => tally(concurso, b).ok);
    const bads   = concurso.boletos.map(b => tally(concurso, b).bad);
    const pends  = concurso.boletos.map(b => tally(concurso, b).pend);

    cache.set(canvasId, new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Aciertos', data: oks,   backgroundColor: COLORS.ok,   borderRadius: 6, stack: 's1' },
          { label: 'Fallos',   data: bads,  backgroundColor: COLORS.bad,  borderRadius: 6, stack: 's1' },
          { label: 'Pend.',    data: pends, backgroundColor: COLORS.pend, borderRadius: 6, stack: 's1' }
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#374151', font: { size: 11 } } },
          y: { stacked: true, beginAtZero: true, grid: { color: '#eef0f3' }, ticks: { color: '#6b7280', stepSize: 1 } }
        }
      }
    }));
  };

  // Dona: distribución global de estatus en el concurso.
  Charts.renderPie = (canvasId, concurso, tally) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyIfExists(canvasId);

    // Suma todos los boletos.
    let ok = 0, bad = 0, pend = 0;
    concurso.boletos.forEach(b => {
      const t = tally(concurso, b); ok += t.ok; bad += t.bad; pend += t.pend;
    });

    cache.set(canvasId, new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Aciertos', 'Fallos', 'Pendientes'],
        datasets: [{
          data: [ok, bad, pend],
          backgroundColor: [COLORS.ok, COLORS.bad, COLORS.pend],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: { ...baseOpts, cutout: '62%' }
    }));
  };

  // Limpia todos los charts (al cambiar de pestaña, opcional).
  Charts.destroyAll = () => { cache.forEach(ch => ch.destroy()); cache.clear(); };

  window.App.Charts = Charts;
})();
