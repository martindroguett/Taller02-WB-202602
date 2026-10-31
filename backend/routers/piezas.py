from fastapi import APIRouter, HTTPException, Response, status

from database import Sesion
from models import Pieza

router = APIRouter(prefix="/piezas", tags=["Piezas"])


@router.get("/{id}/imagen", response_class=Response)
def imagen_pieza(id: int, db: Sesion):
    pieza = db.get(Pieza, id)
    if pieza is None or pieza.imagen_tipo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La pieza no tiene una imagen guardada")

    return Response(
        content=pieza.imagen_datos,
        media_type=pieza.imagen_tipo,

        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
