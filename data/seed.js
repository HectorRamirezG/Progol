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
    //  PROGOL MEDIA SEMANA  (9 partidos)
    //  Nota: los nombres de equipos son placeholders. Edítalos en BD.
    // ----------------------------------------------------------------
    {
      id: "mediasemana-2026-06",
      tipo: "mediasemana",
      nombre: "Progol Media Semana",
      partidos: [
        { n: 1, local: "Partido 1", visitante: "—", resultado: "Pendiente" },
        { n: 2, local: "Partido 2", visitante: "—", resultado: "Pendiente" },
        { n: 3, local: "Partido 3", visitante: "—", resultado: "Pendiente" },
        { n: 4, local: "Partido 4", visitante: "—", resultado: "Pendiente" },
        { n: 5, local: "Partido 5", visitante: "—", resultado: "Pendiente" },
        { n: 6, local: "Partido 6", visitante: "—", resultado: "Pendiente" },
        { n: 7, local: "Partido 7", visitante: "—", resultado: "Pendiente" },
        { n: 8, local: "Partido 8", visitante: "—", resultado: "Pendiente" },
        { n: 9, local: "Partido 9", visitante: "—", resultado: "Pendiente" }
      ],
      boletos: [
        {
          id: "ms-b1",
          nombre: "Media Semana 1",
          fecha: "2026-06-07",
          picks: ["E","L","E","L","L","E","L","V","V"]
        },
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
