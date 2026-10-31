from fastapi import APIRouter
from sqlalchemy import select

from database import Sesion
from models import Categoria
from schemas import CategoriaRespuesta

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get("", response_model=list[CategoriaRespuesta])
def listar_categorias(db: Sesion):
    return db.scalars(select(Categoria).order_by(Categoria.id)).all()
