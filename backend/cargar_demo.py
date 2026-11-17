"""Carga los datos de demo en una base de datos remota (por ejemplo la de Railway).

Uso, desde la carpeta backend/ y con las dependencias instaladas (pip install -r requirements.txt):

    python3 cargar_demo.py "postgresql://usuario:clave@host:puerto/base"

La dirección es la URL pública de PostgreSQL (en Railway: servicio de la base › Variables › DATABASE_PUBLIC_URL).
Reemplaza a los 18 usuarios de demo y todo lo suyo; las cuentas reales no se tocan.
"""
import os
import sys
from urllib.parse import unquote, urlparse


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    url = urlparse(sys.argv[1])
    if url.scheme not in ("postgres", "postgresql") or not url.hostname:
        sys.exit("La dirección debe ser del tipo postgresql://usuario:clave@host:puerto/base")

    os.environ["POSTGRES_USER"] = unquote(url.username or "")
    os.environ["POSTGRES_PASSWORD"] = unquote(url.password or "")
    os.environ["POSTGRES_HOST"] = url.hostname
    os.environ["POSTGRES_PORT"] = str(url.port or 5432)
    os.environ["POSTGRES_DB"] = url.path.lstrip("/")
    os.environ.setdefault("JWT_SECRET", "solo-para-cargar-datos")

    print(f"Base de datos: {url.hostname}:{url.port or 5432}/{url.path.lstrip('/')}")
    if input("Se reemplazarán los usuarios de demo. ¿Continuar? (s/n) ").strip().lower() != "s":
        sys.exit("Cancelado.")

    import seed

    seed.main()


if __name__ == "__main__":
    main()
