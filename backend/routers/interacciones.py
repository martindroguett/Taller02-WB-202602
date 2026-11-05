from fastapi import APIRouter, Request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import Sesion
from models import Guardado, MeGusta, Pieza, Seguimiento, Usuario
from routers.piezas import Desplazamiento, Limite, paginar, pieza_o_404
from schemas import EstadoGuardado, EstadoMeGusta, Pagina, PiezaRespuesta
from seguridad import UsuarioActual

router = APIRouter(tags=["Me gusta, guardados y feed"])

TablaUnion = type[MeGusta] | type[Guardado]


def marcar(db: Session, tabla: TablaUnion, usuario: Usuario, pieza_id: int) -> None:
    """Agrega la fila si no existe. Repetirlo no es error: queda igual (idempotente)."""
    if db.get(tabla, (usuario.id, pieza_id)) is not None:
        return
    db.add(tabla(usuario_id=usuario.id, pieza_id=pieza_id))
    try:
        db.commit()
    except IntegrityError:
        # Dos clics casi simultáneos: la clave primaria frenó el duplicado y el resultado es el mismo.
        db.rollback()


def desmarcar(db: Session, tabla: TablaUnion, usuario: Usuario, pieza_id: int) -> None:
    """Borra la fila si existe. Quitar algo que no estaba tampoco es error."""
    fila = db.get(tabla, (usuario.id, pieza_id))
    if fila is not None:
        db.delete(fila)
        db.commit()


def total(db: Session, tabla: TablaUnion, pieza_id: int) -> int:
    return db.scalar(select(func.count()).where(tabla.pieza_id == pieza_id))


# ---------- Me gusta ----------


@router.post("/piezas/{id}/megusta", response_model=EstadoMeGusta)
def dar_megusta(id: int, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    marcar(db, MeGusta, usuario, id)
    return EstadoMeGusta(gustada=True, megusta=total(db, MeGusta, id))


@router.delete("/piezas/{id}/megusta", response_model=EstadoMeGusta)
def quitar_megusta(id: int, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    desmarcar(db, MeGusta, usuario, id)
    return EstadoMeGusta(gustada=False, megusta=total(db, MeGusta, id))


# ---------- Guardados (favoritos) ----------


@router.post("/piezas/{id}/guardar", response_model=EstadoGuardado)
def guardar(id: int, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    marcar(db, Guardado, usuario, id)
    return EstadoGuardado(guardada=True, guardados=total(db, Guardado, id))


@router.delete("/piezas/{id}/guardar", response_model=EstadoGuardado)
def quitar_guardado(id: int, usuario: UsuarioActual, db: Sesion):
    pieza_o_404(db, id)
    desmarcar(db, Guardado, usuario, id)
    return EstadoGuardado(guardada=False, guardados=total(db, Guardado, id))


@router.get("/favoritos", response_model=Pagina[PiezaRespuesta])
def favoritos(
    request: Request,
    usuario: UsuarioActual,
    db: Sesion,
    limite: Limite = 20,
    desplazamiento: Desplazamiento = 0,
):
    """Las piezas que guardó el usuario, la guardada más recientemente primero."""
    consulta = (
        select(Pieza)
        .join(Guardado, Guardado.pieza_id == Pieza.id)
        .where(Guardado.usuario_id == usuario.id)
        .order_by(Guardado.creado_en.desc(), Pieza.id.desc())
    )
    return paginar(db, consulta, request, usuario, limite, desplazamiento)


# ---------- Feed ----------


@router.get("/feed", response_model=Pagina[PiezaRespuesta])
def feed(
    request: Request,
    usuario: UsuarioActual,
    db: Sesion,
    limite: Limite = 20,
    desplazamiento: Desplazamiento = 0,
):
    """Las piezas de las personas que sigue el usuario, la más nueva primero."""
    consulta = (
        select(Pieza)
        .join(Seguimiento, Seguimiento.seguido_id == Pieza.usuario_id)
        .where(Seguimiento.seguidor_id == usuario.id)
        .order_by(Pieza.creado_en.desc(), Pieza.id.desc())
    )
    return paginar(db, consulta, request, usuario, limite, desplazamiento)
