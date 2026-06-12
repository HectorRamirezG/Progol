// Chart.js: graficos pro con paleta liquid glass.
// - Barras apiladas con gradient indigo/violeta/menta.
// - Doughnut con numero central de progreso (%).
// - Datalabels (chartjs-plugin-datalabels) para mostrar valores in-bar.
window.App = window.App || {};

(() => {
  'use strict';

  const Charts = {};
  const cache = new Map();

  // Paleta consistente con liquid-glass.
  const C = {
    ok:     { solid: '#10b981', light: '#34d399', soft: 'rgba(16,185,129,.12)' },
    bad:    { solid: '#ef4444', light: '#f87171', soft: 'rgba(239,68,68,.12)' },
    pend:   { solid: '#8b5cf6', light: '#a78bfa', soft: 'rgba(139,92,246,.12)' },
    navy:   '#0b1733',
    indigo: '#6366f1',
    text:   '#1e293b',
    muted:  '#64748b',
    grid:   'rgba(148,163,184,.18)',
    surface:'#ffffff'
  };

  const FONT = "'Inter','SF Pro Display','Segoe UI',system-ui,sans-serif";

  // Registra el plugin de datalabels (si esta cargado).
  if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', { display: false }); // off por defecto
  }
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = FONT;
    Chart.defaults.color = C.text;
    Chart.defaults.borderColor = C.grid;
  }

  // Crea un gradient lineal vertical (top -> bottom).
  const gradV = (ctx, area, fromHex, toHex) => {
    if (!area) return fromHex;
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, fromHex);
    g.addColorStop(1, toHex);
    return g;
  };

  // Tooltip estilo liquid-glass.
  const tooltipOpts = {
    backgroundColor: 'rgba(11,23,51,.92)',
    titleColor: '#fff',
    bodyColor: '#e2e8f0',
    padding: 12,
    cornerRadius: 12,
    displayColors: true,
    boxPadding: 6,
    borderColor: 'rgba(255,255,255,.08)',
    borderWidth: 1,
    titleFont: { weight: '600', size: 12 },
    bodyFont: { size: 12 }
  };

  const legendOpts = {
    position: 'bottom',
    labels: {
      usePointStyle: true,
      pointStyle: 'circle',
      boxWidth: 8,
      boxHeight: 8,
      padding: 14,
      color: C.muted,
      font: { size: 11, weight: '600' }
    }
  };

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    animation: { duration: 700, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: legendOpts, tooltip: tooltipOpts }
  };

  // Plugin: numero grande al centro del doughnut (% aciertos).
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart, _args, opts) {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      const big = opts.big ?? '';
      const small = opts.small ?? '';
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.navy;
      ctx.font = `700 26px ${FONT}`;
      ctx.fillText(big, cx, cy - 6);
      ctx.fillStyle = C.muted;
      ctx.font = `600 10px ${FONT}`;
      ctx.fillText(small, cx, cy + 14);
      ctx.restore();
    }
  };

  // Destruye chart anterior si existe.
  const destroyIfExists = (canvasId) => {
    if (cache.has(canvasId)) {
      cache.get(canvasId).destroy();
      cache.delete(canvasId);
    }
  };

  // ============== BARRAS apiladas: aciertos por boleto ==============
  Charts.renderBars = (canvasId, concurso, tally) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyIfExists(canvasId);

    const labels = concurso.boletos.map(b => b.nombre);
    const oks    = concurso.boletos.map(b => tally(concurso, b).ok);
    const bads   = concurso.boletos.map(b => tally(concurso, b).bad);
    const pends  = concurso.boletos.map(b => tally(concurso, b).pend);
    const totals = concurso.boletos.map((_, i) => oks[i] + bads[i] + pends[i]);

    cache.set(canvasId, new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Aciertos',
            data: oks,
            backgroundColor: (ctx) => gradV(ctx.chart.ctx, ctx.chart.chartArea, C.ok.light, C.ok.solid),
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            stack: 's1',
            maxBarThickness: 38
          },
          {
            label: 'Fallos',
            data: bads,
            backgroundColor: (ctx) => gradV(ctx.chart.ctx, ctx.chart.chartArea, C.bad.light, C.bad.solid),
            borderRadius: 4,
            borderSkipped: false,
            stack: 's1',
            maxBarThickness: 38
          },
          {
            label: 'Pendientes',
            data: pends,
            backgroundColor: (ctx) => gradV(ctx.chart.ctx, ctx.chart.chartArea, C.pend.light, C.pend.solid),
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            stack: 's1',
            maxBarThickness: 38
          }
        ]
      },
      options: {
        ...baseOpts,
        layout: { padding: { top: 18, right: 6, bottom: 0, left: 0 } },
        scales: {
          x: {
            stacked: true,
            grid: { display: false, drawBorder: false },
            ticks: { color: C.muted, font: { size: 11, weight: '600' } }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: C.grid, drawBorder: false, lineWidth: 1 },
            ticks: { color: C.muted, stepSize: 1, font: { size: 10 }, padding: 6 }
          }
        },
        plugins: {
          ...baseOpts.plugins,
          tooltip: {
            ...tooltipOpts,
            callbacks: {
              footer: (items) => {
                if (!items || !items.length) return '';
                const i = items[0].dataIndex;
                return `Total: ${totals[i]} partidos`;
              }
            }
          },
          datalabels: {
            display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0,
            color: '#fff',
            font: { weight: '700', size: 10, family: FONT },
            textShadowColor: 'rgba(0,0,0,.25)',
            textShadowBlur: 2,
            formatter: (val) => val
          }
        }
      }
    }));
  };

  // ============== DOUGHNUT: distribucion global + % central ==============
  Charts.renderPie = (canvasId, concurso, tally) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;
    destroyIfExists(canvasId);

    let ok = 0, bad = 0, pend = 0;
    concurso.boletos.forEach(b => {
      const t = tally(concurso, b); ok += t.ok; bad += t.bad; pend += t.pend;
    });
    const total = ok + bad + pend;
    const decididos = ok + bad;
    const aciertoPct = decididos > 0 ? Math.round((ok / decididos) * 100) : 0;

    cache.set(canvasId, new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Aciertos', 'Fallos', 'Pendientes'],
        datasets: [{
          data: [ok, bad, pend],
          backgroundColor: [C.ok.solid, C.bad.solid, C.pend.solid],
          hoverBackgroundColor: [C.ok.light, C.bad.light, C.pend.light],
          borderColor: C.surface,
          borderWidth: 3,
          hoverOffset: 8,
          spacing: 2
        }]
      },
      options: {
        ...baseOpts,
        cutout: '72%',
        layout: { padding: 4 },
        plugins: {
          ...baseOpts.plugins,
          tooltip: {
            ...tooltipOpts,
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed || 0;
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return ` ${ctx.label}: ${v} (${pct}%)`;
              }
            }
          },
          datalabels: { display: false },
          centerText: {
            big: total > 0 ? `${aciertoPct}%` : '—',
            small: decididos > 0 ? `de ${decididos} resueltos` : 'sin datos'
          }
        }
      },
      plugins: [centerTextPlugin]
    }));
  };

  // Limpia todos los charts.
  Charts.destroyAll = () => { cache.forEach(ch => ch.destroy()); cache.clear(); };

  window.App.Charts = Charts;
})();
