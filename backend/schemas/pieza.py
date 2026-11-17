from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DatosPieza(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str = Field(min_length=1, max_length=2000)
    categoria: str = Field(min_length=1)
    imagen_url: str = Field(min_length=1)
    # Opcionales: los completa la app móvil con el escáner y el GPS.
    codigo: str | None = Field(default=None, max_length=128)
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    lugar: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def coordenadas_completas(self):
        if (self.latitud is None) != (self.longitud is None):
            raise ValueError("La ubicación necesita latitud y longitud")
        if self.codigo is not None and not self.codigo:
            self.codigo = None
        if self.latitud is None or not self.lugar:
            self.lugar = None
        return self


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
    codigo: str | None = None
    latitud: float | None = None
    longitud: float | None = None
    lugar: str | None = None
    # Solo viene al buscar piezas cercanas: kilómetros desde el punto pedido.
    distancia_km: float | None = None
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
