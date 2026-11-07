from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .pieza import Dueno


class DatosComentario(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    texto: str = Field(min_length=1, max_length=300)
    # Si responde a otro comentario, el id de ese comentario.
    padre_id: int | None = None


class ComentarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    texto: str
    autor: Dueno
    padre_id: int | None
    megusta: int
    gustado: bool
    creado_en: datetime


class EstadoMeGustaComentario(BaseModel):
    gustado: bool
    megusta: int
