"""
Progol Tracker — scraper y heurísticas
---------------------------------------
- fetch_next_progol(): intenta obtener los próximos partidos del concurso Progol.
  Hace BEST-EFFORT contra la página oficial de Pronósticos Deportivos.
  Si Pronósticos cambia su HTML, esto puede romperse — se documenta abajo
  cómo extenderlo a otras fuentes (sitios de loterías y agregadores).

- suggest_picks(): devuelve un pick (L/E/V) por partido con una probabilidad
  estimada. Hoy usa una heurística MUY simple (ventaja local + reconocimiento
  de nombres "fuertes"). Se incluye un hook claro para enchufar una API real
  de momios.

CONFIG opcional vía variables de entorno:
  ODDS_API_KEY     → si está definida, se usará the-odds-api.com para momios reales.
"""
from __future__ import annotations

import os
import re
from typing import List, Tuple, Dict, Any

import requests
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

# Fuentes candidatas (varias por si una falla)
PROGOL_SOURCES = [
    "https://www.pronosticos.gob.mx/Paginas/Progol.aspx",
    "https://alegrialoteria.com/progol",
]


# =====================================================================
#  SCRAPER: próximo Progol
# =====================================================================
def fetch_next_progol() -> Dict[str, Any]:
    """
    Intenta extraer los partidos del próximo concurso desde la web oficial.
    Devuelve estructura: {nombre, fuente, partidos:[{local, visitante}, ...]}
    """
    errors: List[str] = []
    for url in PROGOL_SOURCES:
        try:
            html = _http_get(url)
            partidos = _parse_partidos(html)
            if partidos:
                return {
                    "nombre": f"Próximo Progol",
                    "fuente": url,
                    "partidos": partidos,
                }
            errors.append(f"{url}: sin partidos en HTML")
        except Exception as e:  # noqa: BLE001
            errors.append(f"{url}: {e}")

    return {
        "nombre": "Próximo Progol (no encontrado)",
        "fuente": None,
        "partidos": [],
        "errors": errors,
        "hint": "Edita backend/scraper.py para apuntar a otra fuente o pega el HTML manualmente.",
    }


def _http_get(url: str, timeout: int = 10) -> str:
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout)
    r.raise_for_status()
    return r.text


# Patrón muy permisivo: "Equipo A vs Equipo B"
_VS_RE = re.compile(r"([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.\- ]{3,40})\s+v[sS]\.?\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.\- ]{3,40})")


def _parse_partidos(html: str) -> List[Dict[str, str]]:
    """
    Intenta extraer pares "Local vs Visitante" usando 2 estrategias:
      1) Estructuras de tabla (<table> con celdas).
      2) Regex genérica sobre el texto plano.
    """
    soup = BeautifulSoup(html, "html.parser")
    partidos: List[Dict[str, str]] = []

    # Estrategia 1: tablas
    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        for tr in rows:
            cells = [c.get_text(strip=True) for c in tr.find_all(["td", "th"])]
            text = " ".join(cells)
            m = _VS_RE.search(text)
            if m:
                local = m.group(1).strip()
                visit = m.group(2).strip()
                if _looks_like_team(local) and _looks_like_team(visit):
                    partidos.append({"local": local, "visitante": visit})

    # Estrategia 2: texto completo
    if not partidos:
        text = soup.get_text(" ", strip=True)
        for m in _VS_RE.finditer(text):
            local = m.group(1).strip()
            visit = m.group(2).strip()
            if _looks_like_team(local) and _looks_like_team(visit):
                partidos.append({"local": local, "visitante": visit})

    # Limitar a un tope razonable (Progol = 14, Revancha = 7 → 21 máx)
    return _dedupe(partidos)[:21]


def _looks_like_team(name: str) -> bool:
    if len(name) < 3 or len(name) > 40:
        return False
    # evita capturar texto basura
    bad = {"reglamento", "concurso", "premio", "ganador", "fecha", "hora"}
    return not any(b in name.lower() for b in bad)


def _dedupe(partidos: List[Dict[str, str]]) -> List[Dict[str, str]]:
    seen = set()
    out: List[Dict[str, str]] = []
    for p in partidos:
        key = (p["local"].lower(), p["visitante"].lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


# =====================================================================
#  SUGERENCIAS DE PICK
# =====================================================================
# Lista (corta) de equipos "fuertes" — sólo para heurística inicial.
# Cuando enchufes una API real, esto puede borrarse.
STRONG_TEAMS = {
    "brasil", "argentina", "francia", "inglaterra", "alemania", "españa", "portugal",
    "países bajos", "holanda", "italia", "bélgica", "uruguay", "croacia", "marruecos",
    "estados unidos", "e.u.a.", "japón", "méxico", "real madrid", "barcelona",
    "manchester city", "liverpool", "bayern", "psg",
}


def suggest_picks(partidos: List[Tuple[str, str]]) -> List[Dict[str, Any]]:
    """
    Para cada partido devuelve:
      {local, visitante, pick, prob: {L, E, V}, fuente}

    Estrategia:
      1) Si ODDS_API_KEY está configurada → intenta usar the-odds-api.com.
      2) Si no, aplica heurística: ventaja local + nombres fuertes.
    """
    odds_api_key = os.environ.get("ODDS_API_KEY", "").strip()
    odds_map: Dict[Tuple[str, str], Dict[str, float]] = {}
    if odds_api_key:
        try:
            odds_map = _fetch_odds_api(odds_api_key)
        except Exception:
            odds_map = {}

    out: List[Dict[str, Any]] = []
    for local, visit in partidos:
        key = (local.lower(), visit.lower())
        if key in odds_map:
            probs = odds_map[key]
            fuente = "the-odds-api"
        else:
            probs = _heuristic_probs(local, visit)
            fuente = "heuristica"

        pick = max(probs, key=probs.get)
        out.append({
            "local": local,
            "visitante": visit,
            "pick": pick,
            "prob": {k: round(v, 3) for k, v in probs.items()},
            "fuente": fuente,
        })
    return out


def _heuristic_probs(local: str, visit: str) -> Dict[str, float]:
    """Heurística simple: ventaja local + bonus por equipo 'fuerte'."""
    l = 0.40  # ventaja base local
    e = 0.28
    v = 0.32

    if local.lower() in STRONG_TEAMS:
        l += 0.10
        v -= 0.05
        e -= 0.05
    if visit.lower() in STRONG_TEAMS:
        v += 0.10
        l -= 0.05
        e -= 0.05

    # Normalizar
    s = l + e + v
    return {"L": l / s, "E": e / s, "V": v / s}


def _fetch_odds_api(api_key: str) -> Dict[Tuple[str, str], Dict[str, float]]:
    """
    Intenta obtener momios de fútbol vía the-odds-api.com y los convierte
    a probabilidades implícitas (1/odds, normalizadas a 1).
    Devuelve un dict {(local_lower, visitante_lower): {L, E, V}}.
    """
    sport = "soccer"  # incluye varios torneos
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    params = {
        "apiKey": api_key,
        "regions": "us,eu",
        "markets": "h2h",
        "oddsFormat": "decimal",
    }
    r = requests.get(url, params=params, timeout=12)
    r.raise_for_status()
    games = r.json()

    out: Dict[Tuple[str, str], Dict[str, float]] = {}
    for g in games:
        home = g.get("home_team", "").lower()
        away = g.get("away_team", "").lower()
        if not home or not away:
            continue
        # Promedia momios de varios bookmakers
        L_list, E_list, V_list = [], [], []
        for bk in g.get("bookmakers", []):
            for mk in bk.get("markets", []):
                if mk.get("key") != "h2h":
                    continue
                for o in mk.get("outcomes", []):
                    name = o.get("name", "").lower()
                    price = o.get("price", 0)
                    if price <= 1:
                        continue
                    if name == home:        L_list.append(1 / price)
                    elif name == away:      V_list.append(1 / price)
                    elif name == "draw":    E_list.append(1 / price)
        if L_list and V_list:
            L = sum(L_list) / len(L_list)
            V = sum(V_list) / len(V_list)
            E = sum(E_list) / len(E_list) if E_list else max(0.01, 1 - L - V)
            s = L + E + V
            out[(home, away)] = {"L": L / s, "E": E / s, "V": V / s}
    return out
