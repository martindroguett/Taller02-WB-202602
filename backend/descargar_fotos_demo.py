"""Descarga las fotos de demo (Wikimedia Commons) a frontend/public/fotos-demo.

Uso, desde la raíz del repositorio:  python3 backend/descargar_fotos_demo.py
Las fotos no se suben al repositorio; los autores y licencias están en backend/fotos_demo.json.
"""
import json
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "frontend" / "public" / "fotos-demo"
ENCABEZADOS = {"User-Agent": "VitrinaTaller/1.0 (proyecto academico)"}

DESTINO.mkdir(exist_ok=True)
fotos = json.loads((RAIZ / "backend" / "fotos_demo.json").read_text(encoding="utf-8"))
for foto in fotos:
    archivo = DESTINO / foto["archivo"]
    if archivo.exists():
        continue
    for intento in range(4):
        try:
            peticion = urllib.request.Request(foto["url"], headers=ENCABEZADOS)
            archivo.write_bytes(urllib.request.urlopen(peticion, timeout=30).read())
            break
        except OSError:
            time.sleep(3)
    else:
        print("No se pudo bajar", foto["archivo"])
print(f"Listo: {len(list(DESTINO.glob('*.jpg')))} fotos en {DESTINO}")
