from pydantic import BaseModel, ConfigDict


class CategoriaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    nombre: str
