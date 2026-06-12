// =====================================================================
//  DATOS SEMILLA — Progol & Revancha
//  Cada "concurso" agrupa N partidos + M boletos.
//  El modelo es genérico para que sirva con cualquier jornada futura.
// =====================================================================

window.SEED_DATA = {
  version: 1,
  concursos: [
    // ----------------------------------------------------------------
    //  PROGOL PRINCIPAL  (14 partidos)
    // ----------------------------------------------------------------
    {
      id: "progol-2026-06",
      tipo: "progol",
      nombre: "Progol Principal",
      partidos: [
        { n: 1,  local: "México",          visitante: "Sudáfrica",     resultado: "Pendiente" },
        { n: 2,  local: "Rep. Corea",      visitante: "Chequia",       resultado: "Pendiente" },
        { n: 3,  local: "Canadá",          visitante: "Bosnia",        resultado: "Pendiente" },
        { n: 4,  local: "E.U.A.",          visitante: "Paraguay",      resultado: "Pendiente" },
        { n: 5,  local: "Brasil",          visitante: "Marruecos",     resultado: "Pendiente" },
        { n: 6,  local: "Australia",       visitante: "Turquía",       resultado: "Pendiente" },
        { n: 7,  local: "Países Bajos",    visitante: "Japón",         resultado: "Pendiente" },
        { n: 8,  local: "Costa de Marfil", visitante: "Ecuador",       resultado: "Pendiente" },
        { n: 9,  local: "Suecia",          visitante: "Túnez",         resultado: "Pendiente" },
        { n: 10, local: "Bélgica",         visitante: "Egipto",        resultado: "Pendiente" },
        { n: 11, local: "Irán",            visitante: "Nueva Zelanda", resultado: "Pendiente" },
        { n: 12, local: "Francia",         visitante: "Senegal",       resultado: "Pendiente" },
        { n: 13, local: "Inglaterra",      visitante: "Croacia",       resultado: "Pendiente" },
        { n: 14, local: "Ghana",           visitante: "Panamá",        resultado: "Pendiente" }
      ],
      boletos: [
        {
          id: "p-b1",
          nombre: "Boleto 1",
          fecha: "2026-06-01",
          picks: ["L","L","L","E","L","E","V","E","V","L","L","L","L","E"]
        },
        {
          id: "p-b2",
          nombre: "Boleto 2",
          fecha: "2026-06-10",
          picks: ["E","L","E","E","L","E","L","V","L","E","E","V","V","E"]
        }
      ]
    },

    // ----------------------------------------------------------------
    //  REVANCHA  (7 partidos)
    // ----------------------------------------------------------------
    {
      id: "revancha-2026-06",
      tipo: "revancha",
      nombre: "Revancha",
      partidos: [
        { n: 1, local: "México",          visitante: "Sudáfrica",  resultado: "Pendiente" },
        { n: 2, local: "Rep. Corea",      visitante: "Chequia",    resultado: "Pendiente" },
        { n: 3, local: "Países Bajos",    visitante: "Japón",      resultado: "Pendiente" },
        { n: 4, local: "Costa de Marfil", visitante: "Ecuador",    resultado: "Pendiente" },
        { n: 5, local: "Arabia Saudita",  visitante: "Uruguay",    resultado: "Pendiente" },
        { n: 6, local: "Argentina",       visitante: "Argelia",    resultado: "Pendiente" },
        { n: 7, local: "Inglaterra",      visitante: "Croacia",    resultado: "Pendiente" }
      ],
      boletos: [
        {
          id: "r-b1",
          nombre: "Revancha 1",
          fecha: "2026-06-01",
          picks: ["E","L","V","V","E","L","E"]
        },
        {
          id: "r-b2",
          nombre: "Revancha 2",
          fecha: "2026-06-10",
          picks: ["L","L","L","E","E","L","E"]
        }
      ]
    },

    // ----------------------------------------------------------------
    //  PROGOL MEDIA SEMANA — Concurso 799 (07-jun-2026)
    // ----------------------------------------------------------------
    {
      id: "mediasemana-799",
      tipo: "mediasemana",
      nombre: "Media Semana #799",
      partidos: [
        { n: 1, local: "México",          visitante: "Sudáfrica",  resultado: "Pendiente" },
        { n: 2, local: "Rep. Corea",      visitante: "Chequia",    resultado: "Pendiente" },
        { n: 3, local: "Canadá",          visitante: "Bosnia",     resultado: "Pendiente" },
        { n: 4, local: "E.U.A.",          visitante: "Paraguay",   resultado: "Pendiente" },
        { n: 5, local: "Brasil",          visitante: "Marruecos",  resultado: "Pendiente" },
        { n: 6, local: "Australia",       visitante: "Turquía",    resultado: "Pendiente" },
        { n: 7, local: "Países Bajos",    visitante: "Japón",      resultado: "Pendiente" },
        { n: 8, local: "Costa de Marfil", visitante: "Ecuador",    resultado: "Pendiente" },
        { n: 9, local: "Suecia",          visitante: "Túnez",      resultado: "Pendiente" }
      ],
      boletos: [
        {
          id: "ms-b1",
          nombre: "Media Semana 1",
          fecha: "2026-06-07",
          picks: ["E","L","E","L","L","E","L","V","V"]
        }
      ]
    },

    // ----------------------------------------------------------------
    //  PROGOL MEDIA SEMANA — Concurso 800 (10-jun-2026)
    // ----------------------------------------------------------------
    {
      id: "mediasemana-800",
      tipo: "mediasemana",
      nombre: "Media Semana #800",
      partidos: [
        { n: 1, local: "México",      visitante: "Rep. Corea", resultado: "Pendiente" },
        { n: 2, local: "Francia",     visitante: "Senegal",    resultado: "Pendiente" },
        { n: 3, local: "Inglaterra",  visitante: "Croacia",    resultado: "Pendiente" },
        { n: 4, local: "Ghana",       visitante: "Panamá",     resultado: "Pendiente" },
        { n: 5, local: "Chequia",     visitante: "Sudáfrica",  resultado: "Pendiente" },
        { n: 6, local: "Suiza",       visitante: "Bosnia",     resultado: "Pendiente" },
        { n: 7, local: "E.U.A.",      visitante: "Australia",  resultado: "Pendiente" },
        { n: 8, local: "Escocia",     visitante: "Marruecos",  resultado: "Pendiente" },
        { n: 9, local: "Turquía",     visitante: "Paraguay",   resultado: "Pendiente" }
      ],
      boletos: [
        {
          id: "ms-b2",
          nombre: "Media Semana 2",
          fecha: "2026-06-10",
          picks: ["L","E","L","V","E","E","V","V","V"]
        }
      ]
    }
  ]
};
