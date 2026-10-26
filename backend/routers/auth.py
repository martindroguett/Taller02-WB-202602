from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from database import Sesion
from models import Usuario
from schemas import TokenRespuesta, UsuarioLogin, UsuarioPrivado, UsuarioRegistro
from seguridad import UsuarioActual, crear_token, hashear_password, verificar_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def respuesta_con_token(usuario: Usuario) -> TokenRespuesta:
    return TokenRespuesta(
        access_token=crear_token(usuario.id),
        usuario=UsuarioPrivado.model_validate(usuario),
    )


@router.post("/registro", response_model=TokenRespuesta, status_code=status.HTTP_201_CREATED)
def registrar(datos: UsuarioRegistro, db: Sesion):
    ocupado = db.scalar(
        select(Usuario).where(or_(Usuario.username == datos.username, Usuario.email == datos.email))
    )
    if ocupado:
        campo = "nombre de usuario" if ocupado.username == datos.username else "email"
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"Ese {campo} ya está registrado")

    usuario = Usuario(
        username=datos.username,
        email=datos.email,
        password_hash=hashear_password(datos.password),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:
        # Dos registros con los mismos datos al mismo tiempo: la restricción UNIQUE de la tabla lo frena.
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="El nombre de usuario o el email ya están registrados"
        )
    db.refresh(usuario)  # trae el id y creado_en que generó PostgreSQL
    return respuesta_con_token(usuario)


@router.post("/login", response_model=TokenRespuesta)
def ingresar(datos: UsuarioLogin, db: Sesion):
    usuario = db.scalar(select(Usuario).where(Usuario.email == datos.email))
    # El mismo mensaje en los dos casos, para no revelar qué emails tienen cuenta.
    if usuario is None or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    return respuesta_con_token(usuario)


@router.get("/yo", response_model=UsuarioPrivado)
def yo(usuario: UsuarioActual):
    return usuario
