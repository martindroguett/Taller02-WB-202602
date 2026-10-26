from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UsuarioRegistro(BaseModel):
    # Letras, números, _ y punto, igual que el formulario de Angular (/^[\w.]{3,30}$/).
    # El mínimo de 3 caracteres también impide registrar "yo", que es una ruta (/usuarios/yo).
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_.]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("username")
    @classmethod
    def normalizar_username(cls, valor: str) -> str:
        # En minúsculas, para que "Tomas" y "tomas" no puedan ser dos cuentas distintas.
        return valor.lower()

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, valor: str) -> str:
        return valor.lower()

    @field_validator("password")
    @classmethod
    def cabe_en_bcrypt(cls, valor: str) -> str:
        # bcrypt acepta hasta 72 bytes, y una letra con tilde ocupa 2.
        if len(valor.encode()) > 72:
            raise ValueError("La contraseña es demasiado larga")
        return valor


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalizar_email(cls, valor: str) -> str:
        return valor.lower()


class UsuarioPrivado(BaseModel):
    """Datos que solo ve el propio usuario. Nunca incluye password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    nombre_visible: str | None
    bio: str
    avatar_url: str | None
    seguidores: int
    siguiendo: int
    creado_en: datetime

    @field_validator("bio", mode="before")
    @classmethod
    def bio_como_texto(cls, valor: str | None) -> str:
        # En la base puede estar vacía (NULL); al frontend siempre le llega un texto.
        return valor or ""


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioPrivado
