from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .pieza import Dueno


class DatosComentario(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    texto: str = Field(min_length=1, max_length=300)


class ComentarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    texto: str
    autor: Dueno
    creado_en: datetime
