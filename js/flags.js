// Mapa equipo/pais -> codigo ISO 3166-1 alpha-2 (o codigo regional para Inglaterra/Escocia).
// Para banderas usamos flagcdn.com (PNG livianos via CDN, sin auth).
window.App = window.App || {};

(() => {
  'use strict';

  // Normaliza un nombre: minusculas, sin tildes, sin puntos, sin espacios extras.
  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Tabla principal: clave normalizada -> ISO/codigo flagcdn.
  // flagcdn soporta gb-eng / gb-sct / gb-wls / gb-nir como subdivisiones UK.
  const TABLE = {
    'mexico': 'mx', 'sudafrica': 'za', 'rep corea': 'kr', 'corea': 'kr', 'corea del sur': 'kr',
    'chequia': 'cz', 'republica checa': 'cz', 'canada': 'ca', 'bosnia': 'ba',
    'eua': 'us', 'usa': 'us', 'estados unidos': 'us', 'estados unidos de america': 'us',
    'paraguay': 'py', 'brasil': 'br', 'marruecos': 'ma', 'australia': 'au', 'turquia': 'tr',
    'paises bajos': 'nl', 'paises bajo': 'nl', 'holanda': 'nl', 'japon': 'jp',
    'costa de marfil': 'ci', 'costa marf': 'ci', 'ecuador': 'ec',
    'suecia': 'se', 'tunez': 'tn', 'belgica': 'be', 'egipto': 'eg', 'iran': 'ir',
    'nueva zelanda': 'nz', 'francia': 'fr', 'senegal': 'sn',
    'inglaterra': 'gb-eng', 'croacia': 'hr', 'ghana': 'gh', 'panama': 'pa',
    'arabia saudita': 'sa', 'uruguay': 'uy', 'argentina': 'ar', 'argelia': 'dz',
    'suiza': 'ch', 'escocia': 'gb-sct', 'gales': 'gb-wls',
    'portugal': 'pt', 'espana': 'es', 'alemania': 'de', 'italia': 'it',
    'colombia': 'co', 'chile': 'cl', 'peru': 'pe', 'bolivia': 'bo', 'venezuela': 've',
    'estados unidos mexicanos': 'mx', 'corea del norte': 'kp',
    'rusia': 'ru', 'ucrania': 'ua', 'polonia': 'pl', 'dinamarca': 'dk',
    'noruega': 'no', 'finlandia': 'fi', 'serbia': 'rs',
    'qatar': 'qa', 'eau': 'ae', 'emiratos arabes': 'ae',
    'guatemala': 'gt', 'honduras': 'hn', 'el salvador': 'sv', 'costa rica': 'cr',
    'jamaica': 'jm', 'haiti': 'ht', 'cuba': 'cu', 'rep dominicana': 'do',
    'nigeria': 'ng', 'camerun': 'cm', 'algeria': 'dz'
  };

  // Devuelve codigo ISO o null si no se encontro.
  const codeFor = (name) => TABLE[norm(name)] || null;

  // Devuelve <img> de bandera o cadena vacia si no hay match (ej: "—").
  // size: 20|40|80|160 (ancho en px del CDN). Usamos 20 para tabla, 40 para editor.
  const imgFor = (name, size = 20) => {
    const code = codeFor(name);
    if (!code) return '';
    return `<img class="flag" src="https://flagcdn.com/w${size}/${code}.png" alt="" loading="lazy" />`;
  };

  window.App.Flags = { codeFor, imgFor, norm };
})();
