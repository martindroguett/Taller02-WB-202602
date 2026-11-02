import base64
import binascii
import re
from urllib.parse import urlsplit

from fastapi import HTTPException, Request, status

from models import Pieza

MAX_BYTES = 2 * 1024 * 1024
MAX_LARGO_BASE64 = 4 * -(-MAX_BYTES // 3)
MAX_LARGO_URL = 2000 

ENCABEZADO_DATA = re.compile(r"data:(image/(?:jpeg|png|webp));base64")
RUTA_IMAGEN = re.compile(r"/api/piezas/(\d+)/imagen")


def _error(detalle: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail=detalle)


def _tipo_real(datos: bytes) -> str | None:
    """Reconoce el formato por sus primeros bytes (su firma), sin confiar en lo que declara el cliente."""
    if datos.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if datos.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return "image/webp"
    return None


def _asignar_datos(pieza: Pieza, valor: str) -> None:
    encabezado, _, texto = valor.partition(",")
    tipo = ENCABEZADO_DATA.fullmatch(encabezado)
    if tipo is None:
        raise _error("La imagen debe ser JPEG, PNG o WebP")

    if len(texto) > MAX_LARGO_BASE64:
        raise _error("La imagen pesa más de 2 MB")
    try:
        datos = base64.b64decode(texto, validate=True)
    except binascii.Error:
        raise _error("La imagen no se pudo leer")
    if len(datos) > MAX_BYTES:
        raise _error("La imagen pesa más de 2 MB")
    if _tipo_real(datos) != tipo[1]:
        raise _error("El archivo no corresponde al tipo de imagen indicado")

    pieza.imagen_datos = datos
    pieza.imagen_tipo = tipo[1]
    pieza.imagen_url = None


def asignar_imagen(pieza: Pieza, valor: str) -> None:
    """Guarda en la pieza la imagen que llegó en imagen_url, o responde 400 si no es válida."""
    if valor.startswith("data:"):
        _asignar_datos(pieza, valor)
        return

    partes = urlsplit(valor)
    propia = RUTA_IMAGEN.fullmatch(partes.path)
    if propia:
        
        if pieza.id is not None and int(propia[1]) == pieza.id and pieza.imagen_tipo:
            return
        raise _error("Esa dirección corresponde a la imagen de otra pieza")

    if len(valor) > MAX_LARGO_URL:
        raise _error("La dirección de la imagen es demasiado larga")
    externa = partes.scheme in ("http", "https") and partes.netloc

    relativa = not partes.scheme and not partes.netloc and valor.startswith("/")
    if not (externa or relativa):
        raise _error("La imagen debe ser JPEG, PNG o WebP, o una dirección http(s) o que empiece con /")

    pieza.imagen_url = valor
    pieza.imagen_datos = None
    pieza.imagen_tipo = None


def url_imagen(pieza: Pieza, request: Request) -> str:
    """El imagen_url de las respuestas: la dirección guardada, o la ruta que sirve los bytes."""
    if pieza.imagen_tipo is None:
        return pieza.imagen_url

    url = request.url_for("imagen_pieza", id=pieza.id)

    return str(url.include_query_params(v=int(pieza.actualizado_en.timestamp())))
