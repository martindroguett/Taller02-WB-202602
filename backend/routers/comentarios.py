from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from database import Sesion
from models import Comentario, ComentarioMeGusta
from routers.piezas import Desplazamiento, Limite, pieza_o_404
from schemas import ComentarioRespuesta, DatosComentario, EstadoMeGustaComentario, Pagina
from seguridad import UsuarioActual, UsuarioOpcional

router = APIRouter(tags=["Comentarios"])


def a_respuesta(comentario: Comentario, megusta: int = 0, gustado: bool = False) -> ComentarioRespuesta:
    return ComentarioRespuesta(
        id=comentario.id,
        texto=comentario.texto,
        autor={"id": comentario.usuario.id, "username": comentario.usuario.username},
        padre_id=comentario.padre_id,
        megusta=megusta,
        gustado=gustado,
        creado_en=comentario.creado_en,
    )


def comentario_o_404(db: Sesion, id: int) -> Comentario:
    comentario = db.get(Comentario, id)
    if comentario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="El comentario no existe")
    return comentario


def total_megusta(db: Sesion, comentario_id: int) -> int:
    return db.scalar(select(func.count()).where(ComentarioMeGusta.comentario_id == comentario_id))


@router.get("/piezas/{id}/comentarios", response_model=Pagina[ComentarioRespuesta])
def listar(
    id: int, db: Sesion, usuario: UsuarioOpcional, limite: Limite = 20, desplazamiento: Desplazamiento = 0
):
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
    ids = [c.id for c in filas]
    cuentas = dict(
        db.execute(
            select(ComentarioMeGusta.comentario_id, func.count())
            .where(ComentarioMeGusta.comentario_id.in_(ids))
            .group_by(ComentarioMeGusta.comentario_id)
        ).all()
    )
    propios = set()
    if usuario is not None:
        propios = set(
            db.scalars(
                select(ComentarioMeGusta.comentario_id).where(
                    ComentarioMeGusta.usuario_id == usuario.id, ComentarioMeGusta.comentario_id.in_(ids)
                )
            )
        )
    return Pagina(
        items=[a_respuesta(c, cuentas.get(c.id, 0), c.id in propios) for c in filas],
        total=total,
        limite=limite,
        desplazamiento=desplazamiento,
    )


@router.post(
    "/piezas/{id}/comentarios", response_model=ComentarioRespuesta, status_code=status.HTTP_201_CREATED
)
def comentar(id: int, datos: DatosComentario, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    padre_id = datos.padre_id
    if padre_id is not None:
        padre = comentario_o_404(db, padre_id)
        if padre.pieza_id != id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="El comentario no es de esta pieza")
        # Las respuestas son de un solo nivel: responder a una respuesta cuelga del comentario original.
        padre_id = padre.padre_id or padre.id
    comentario = Comentario(pieza_id=id, usuario_id=usuario.id, texto=datos.texto, padre_id=padre_id)
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    return a_respuesta(comentario)


@router.delete("/comentarios/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id: int, usuario: UsuarioActual, db: Sesion):
    comentario = comentario_o_404(db, id)
    # Lo borra quien lo escribió o el dueño de la pieza. Sus respuestas se borran con él.
    if usuario.id not in (comentario.usuario_id, pieza_o_404(db, comentario.pieza_id).usuario_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="No puedes eliminar este comentario")
    db.delete(comentario)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/comentarios/{id}/megusta", response_model=EstadoMeGustaComentario)
def dar_megusta(id: int, usuario: UsuarioActual, db: Sesion):
    comentario_o_404(db, id)
    if db.get(ComentarioMeGusta, (usuario.id, id)) is None:
        db.add(ComentarioMeGusta(usuario_id=usuario.id, comentario_id=id))
        try:
            db.commit()
        except IntegrityError:
            # Dos clics casi simultáneos: la clave primaria frenó el duplicado y el resultado es el mismo.
            db.rollback()
    return EstadoMeGustaComentario(gustado=True, megusta=total_megusta(db, id))


@router.delete("/comentarios/{id}/megusta", response_model=EstadoMeGustaComentario)
def quitar_megusta(id: int, usuario: UsuarioActual, db: Sesion):
    comentario_o_404(db, id)
    fila = db.get(ComentarioMeGusta, (usuario.id, id))
    if fila is not None:
        db.delete(fila)
        db.commit()
    return EstadoMeGustaComentario(gustado=False, megusta=total_megusta(db, id))
