from datetime import UTC, datetime, timedelta
from typing import Annotated

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import configuracion
from database import Sesion
from models import Usuario

def hashear_password(password: str) -> str:
    # gensalt() crea una sal aleatoria: la misma contraseña da un hash distinto cada vez.
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verificar_password(password: str, password_hash: str) -> bool:
    datos = password.encode()
    if len(datos) > 72:  # bcrypt no acepta más; ninguna contraseña registrada es tan larga
        return False
    return bcrypt.checkpw(datos, password_hash.encode())

# ---------- JWT ----------

def crear_token(usuario_id: int) -> str:
    ahora = datetime.now(UTC)
    datos = {
        "sub": str(usuario_id),  # el estándar exige que "sub" sea texto
        "iat": ahora,
        "exp": ahora + timedelta(minutes=configuracion.jwt_expira_minutos),
    }
    return jwt.encode(datos, configuracion.jwt_secret, algorithm=configuracion.jwt_algoritmo)


# auto_error=False: si falta el encabezado respondemos 401 nosotros, en vez del error por defecto.
esquema_bearer = HTTPBearer(auto_error=False)
Credenciales = Annotated[HTTPAuthorizationCredentials | None, Depends(esquema_bearer)]


def _usuario_del_token(credenciales: HTTPAuthorizationCredentials, db: Sesion) -> Usuario | None:
    try:
        datos = jwt.decode(
            credenciales.credentials, configuracion.jwt_secret, algorithms=[configuracion.jwt_algoritmo]
        )
        usuario_id = int(datos["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None  # firma alterada, token vencido o mal formado
    return db.get(Usuario, usuario_id)  # None si la cuenta ya no existe


def usuario_actual(credenciales: Credenciales, db: Sesion) -> Usuario:
    """Dependencia para endpoints protegidos: entrega el usuario del token o responde 401."""
    usuario = _usuario_del_token(credenciales, db) if credenciales else None
    if usuario is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Falta el token o no es válido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario


def usuario_opcional(credenciales: Credenciales, db: Sesion) -> Usuario | None:
    """Para endpoints con acceso «Opcional»: el usuario si mandó un token válido, si no None."""
    return _usuario_del_token(credenciales, db) if credenciales else None


UsuarioActual = Annotated[Usuario, Depends(usuario_actual)]
UsuarioOpcional = Annotated[Usuario | None, Depends(usuario_opcional)]
