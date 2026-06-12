"""
Progol Tracker — Backend (FastAPI)
-----------------------------------
Funcionalidades:
  GET  /health          → ping
  GET  /next-progol     → intenta obtener los partidos del próximo concurso Progol
                          desde la página oficial de Pronósticos.
  POST /suggest         → recibe partidos {local, visitante}[] y devuelve sugerencia
                          de pick basada en una heurística simple (puede extenderse
                          con una API real de momios/probabilidades).

CORS abierto a localhost para que la app sirva directo desde file:// o desde
cualquier puerto local.
"""
from __future__ import annotations

from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scraper import fetch_next_progol, suggest_picks

app = FastAPI(title="Progol Tracker Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ejecución 100% local — sin riesgo
    allow_methods=["*"],
    allow_headers=["*"],
)


class PartidoIn(BaseModel):
    local: str
    visitante: str


class SuggestIn(BaseModel):
    partidos: List[PartidoIn]


@app.get("/health")
def health():
    return {"status": "ok", "service": "progol-tracker-backend"}


@app.get("/next-progol")
def next_progol():
    """
    Intenta obtener la próxima jornada de Progol desde la web oficial.
    Si falla, devuelve un mensaje explicativo (el frontend lo muestra tal cual).
    """
    try:
        data = fetch_next_progol()
        return data
    except Exception as e:
        return {
            "error": str(e),
            "hint": "El scraper no pudo obtener datos. Verifica conexión a internet o "
                    "edita backend/scraper.py para apuntar a otra fuente.",
            "partidos": [],
        }


@app.post("/suggest")
def suggest(payload: SuggestIn):
    """
    Devuelve sugerencias por partido. Se puede mejorar enchufando una API real
    de momios (the-odds-api, api-football, football-data, etc.).
    """
    partidos = [(p.local, p.visitante) for p in payload.partidos]
    return {"sugerencias": suggest_picks(partidos)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)
