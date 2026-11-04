from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field


class DatosPieza(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str = Field(min_length=1, max_length=2000)
    categoria: str = Field(min_length=1)
    imagen_url: str = Field(min_length=1)


class Dueno(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class PiezaRespuesta(BaseModel):
    id: int
    nombre: str
    descripcion: str
    categoria: str 
    imagen_url: str
    dueno: Dueno
    megusta: int
    guardados: int
    gustada: bool
    guardada: bool
    creado_en: datetime
    actualizado_en: datetime

class EstadoMeGusta(BaseModel):
    """Respuesta de dar o quitar me gusta: el estado nuevo y el total actualizado para el contador."""

    gustada: bool
    megusta: int


class EstadoGuardado(BaseModel):
    """Respuesta de guardar o quitar de favoritos."""

    guardada: bool
    guardados: int


T = TypeVar("T")

class Pagina(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limite: int
    desplazamiento: int
