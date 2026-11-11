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

def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    fotos = json.loads((RAIZ / "backend" / "fotos_demo.json").read_text(encoding="utf-8"))
    for foto in fotos:
        archivo = DESTINO / foto["archivo"]
        if archivo.exists() and archivo.stat().st_size > 0:
            continue
        temporal = archivo.with_suffix(archivo.suffix + ".tmp")
        for intento in range(4):
            try:
                peticion = urllib.request.Request(foto["url"], headers=ENCABEZADOS)
                with urllib.request.urlopen(peticion, timeout=30) as respuesta:
                    datos = respuesta.read()
                if not datos:
                    raise OSError("La respuesta está vacía")
                temporal.write_bytes(datos)
                temporal.replace(archivo)
                break
            except OSError as error:
                temporal.unlink(missing_ok=True)
                if intento == 3:
                    raise SystemExit(f"No se pudo bajar {foto['archivo']}: {error}") from error
                time.sleep(3)
    print(f"Listo: {len(fotos)} fotos disponibles en {DESTINO}")


if __name__ == "__main__":
    main()
