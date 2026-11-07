from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select

from database import Sesion
from models import Comentario
from routers.piezas import Desplazamiento, Limite, pieza_o_404
from schemas import ComentarioRespuesta, DatosComentario, Pagina
from seguridad import UsuarioActual

router = APIRouter(tags=["Comentarios"])


def a_respuesta(comentario: Comentario) -> ComentarioRespuesta:
    return ComentarioRespuesta(
        id=comentario.id,
        texto=comentario.texto,
        autor={"id": comentario.usuario.id, "username": comentario.usuario.username},
        creado_en=comentario.creado_en,
    )


@router.get("/piezas/{id}/comentarios", response_model=Pagina[ComentarioRespuesta])
def listar(id: int, db: Sesion, limite: Limite = 20, desplazamiento: Desplazamiento = 0):
    pieza_o_404(db, id)
    donde = Comentario.pieza_id == id
    total = db.scalar(select(func.count()).where(donde))
    # Del más antiguo al más nuevo: se lee como una conversación.
    filas = db.scalars(
        select(Comentario)
        .where(donde)
        .order_by(Comentario.creado_en, Comentario.id)
        .limit(limite)
        .offset(desplazamiento)
    ).all()
    return Pagina(
        items=[a_respuesta(c) for c in filas],
        total=total,
        limite=limite,
        desplazamiento=desplazamiento,
    )


@router.post(
    "/piezas/{id}/comentarios", response_model=ComentarioRespuesta, status_code=status.HTTP_201_CREATED
)
def comentar(id: int, datos: DatosComentario, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    comentario = Comentario(pieza_id=id, usuario_id=usuario.id, texto=datos.texto)
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    return a_respuesta(comentario)


@router.delete("/comentarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id: int, usuario: UsuarioActual, db: Sesion):
    comentario = db.get(Comentario, id)
    if comentario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="El comentario no existe")
    # Lo borra quien lo escribió o el dueño de la pieza.
    if usuario.id not in (comentario.usuario_id, pieza_o_404(db, comentario.pieza_id).usuario_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="No puedes eliminar este comentario")
    db.delete(comentario)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
