"""
Progol Tracker — launcher
--------------------------
Uso:    python run.py

Qué hace:
  1) Crea un venv en .venv si no existe.
  2) Instala las dependencias del backend.
  3) Arranca FastAPI en http://127.0.0.1:8765
  4) Abre index.html en el navegador por defecto.

NOTA: La app frontend funciona también sin Python — basta con abrir index.html.
      Este launcher solo es necesario para el "Asistente" (sugerencias y
      búsqueda automática de próximos partidos).
"""
from __future__ import annotations

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

ROOT      = Path(__file__).resolve().parent
VENV      = ROOT / ".venv"
BACKEND   = ROOT / "backend"
REQS      = BACKEND / "requirements.txt"
INDEX     = ROOT / "index.html"

IS_WINDOWS = os.name == "nt"
VENV_PY    = VENV / ("Scripts/python.exe" if IS_WINDOWS else "bin/python")
VENV_PIP   = VENV / ("Scripts/pip.exe"    if IS_WINDOWS else "bin/pip")


def log(msg: str) -> None:
    print(f"[progol] {msg}", flush=True)


def ensure_venv() -> None:
    if VENV_PY.exists():
        return
    log("Creando entorno virtual en .venv …")
    subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])


def ensure_deps() -> None:
    log("Verificando dependencias…")
    # marker para no reinstalar cada vez
    marker = VENV / ".deps_installed"
    if marker.exists() and marker.stat().st_mtime >= REQS.stat().st_mtime:
        return
    log("Instalando dependencias (primera vez puede tardar)…")
    # No actualizamos pip: el venv recién creado ya trae uno funcional y el
    # upgrade en Windows suele fallar por archivos en uso.
    subprocess.check_call([str(VENV_PY), "-m", "pip", "install", "--disable-pip-version-check", "-r", str(REQS)])
    marker.touch()


def start_backend() -> subprocess.Popen:
    log("Iniciando backend FastAPI en http://127.0.0.1:8765 …")
    return subprocess.Popen(
        [str(VENV_PY), "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8765"],
        cwd=str(BACKEND),
    )


def open_frontend() -> None:
    url = INDEX.as_uri()
    log(f"Abriendo {url}")
    webbrowser.open(url)


def main() -> int:
    if not REQS.exists():
        log(f"No se encontró {REQS}")
        return 1

    ensure_venv()
    ensure_deps()
    proc = start_backend()

    # Espera breve a que arranque uvicorn antes de abrir el navegador
    time.sleep(1.5)
    open_frontend()

    log("Backend corriendo. Ctrl+C para detener.")
    try:
        proc.wait()
    except KeyboardInterrupt:
        log("Deteniendo backend…")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    return 0


if __name__ == "__main__":
    sys.exit(main())
