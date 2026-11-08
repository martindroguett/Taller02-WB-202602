from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from database import Sesion
from models import Pieza, Seguimiento, Usuario
from routers.piezas import Desplazamiento, Limite, paginar
from schemas import Dueno, EstadoSeguimiento, Pagina, PerfilPublico, PiezaRespuesta
from seguridad import UsuarioActual, UsuarioOpcional

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


def usuario_o_404(db: Sesion, username: str) -> Usuario:
    usuario = db.scalar(select(Usuario).where(Usuario.username == username))
    if usuario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="El usuario no existe")
    return usuario


def estado(db: Sesion, seguido_id: int, lo_sigo: bool) -> EstadoSeguimiento:
    seguidores = db.scalar(select(func.count()).where(Seguimiento.seguido_id == seguido_id))
    return EstadoSeguimiento(lo_sigo=lo_sigo, seguidores=seguidores)


@router.get("", response_model=list[Dueno])
def sugeridos(db: Sesion, usuario: UsuarioOpcional, limite: Limite = 5):
    """Coleccionistas para seguir: los con más seguidores, sin contarte a ti ni a quienes ya sigues."""
    consulta = select(Usuario).order_by(Usuario.seguidores.desc(), Usuario.id)
    if usuario is not None:
        ya_sigo = select(Seguimiento.seguido_id).where(Seguimiento.seguidor_id == usuario.id)
        consulta = consulta.where(Usuario.id != usuario.id, Usuario.id.not_in(ya_sigo))
    return [Dueno.model_validate(u) for u in db.scalars(consulta.limit(limite))]


@router.get("/{username}", response_model=PerfilPublico)
def perfil(username: str, db: Sesion, usuario: UsuarioOpcional):
    perfil = usuario_o_404(db, username)
    lo_sigo = usuario is not None and db.get(Seguimiento, (usuario.id, perfil.id)) is not None
    return PerfilPublico(
        id=perfil.id, username=perfil.username, bio=perfil.bio or "",
        seguidores=perfil.seguidores, siguiendo=perfil.siguiendo, lo_sigo=lo_sigo,
    )


@router.get("/{username}/piezas", response_model=Pagina[PiezaRespuesta])
def piezas_usuario(
    username: str, request: Request, db: Sesion, usuario: UsuarioOpcional,
    limite: Limite = 20, desplazamiento: Desplazamiento = 0,
):
    perfil = usuario_o_404(db, username)
    consulta = select(Pieza).where(Pieza.usuario_id == perfil.id).order_by(Pieza.creado_en.desc(), Pieza.id.desc())
    return paginar(db, consulta, request, usuario, limite, desplazamiento)


def pagina_de_usuarios(db: Sesion, union, filtro, limite: int, desplazamiento: int) -> Pagina[Dueno]:
    consulta = select(Usuario).join(Seguimiento, union).where(filtro)
    total = db.scalar(select(func.count()).select_from(consulta.subquery()))
    usuarios = db.scalars(
        consulta.order_by(Seguimiento.creado_en.desc(), Usuario.id.desc()).limit(limite).offset(desplazamiento)
    ).all()
    return Pagina(
        items=[Dueno.model_validate(u) for u in usuarios],
        total=total, limite=limite, desplazamiento=desplazamiento,
    )


@router.get("/{username}/seguidos", response_model=Pagina[Dueno])
def seguidos(
    username: str, db: Sesion, limite: Limite = 20, desplazamiento: Desplazamiento = 0,
):
    """Las personas que sigue el usuario, la seguida más recientemente primero (la fila del Feed)."""
    perfil = usuario_o_404(db, username)
    return pagina_de_usuarios(
        db, Seguimiento.seguido_id == Usuario.id, Seguimiento.seguidor_id == perfil.id, limite, desplazamiento
    )


@router.get("/{username}/seguidores", response_model=Pagina[Dueno])
def seguidores(
    username: str, db: Sesion, limite: Limite = 20, desplazamiento: Desplazamiento = 0,
):
    """Las personas que siguen al usuario, la más reciente primero."""
    perfil = usuario_o_404(db, username)
    return pagina_de_usuarios(
        db, Seguimiento.seguidor_id == Usuario.id, Seguimiento.seguido_id == perfil.id, limite, desplazamiento
    )


@router.post("/{username}/seguir", response_model=EstadoSeguimiento)
def seguir(username: str, usuario: UsuarioActual, db: Sesion):
    perfil = usuario_o_404(db, username)
    if perfil.id == usuario.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="No puedes seguirte a ti mismo")
    if db.get(Seguimiento, (usuario.id, perfil.id)) is None:
        db.add(Seguimiento(seguidor_id=usuario.id, seguido_id=perfil.id))
        try:
            db.commit()
        except IntegrityError:
            # La clave primaria evita duplicados ante solicitudes simultáneas.
            db.rollback()
    return estado(db, perfil.id, True)


@router.delete("/{username}/seguir", response_model=EstadoSeguimiento)
def dejar_de_seguir(username: str, usuario: UsuarioActual, db: Sesion):
    perfil = usuario_o_404(db, username)
    seguimiento = db.get(Seguimiento, (usuario.id, perfil.id))
    if seguimiento is not None:
        db.delete(seguimiento)
        db.commit()
    return estado(db, perfil.id, False)
