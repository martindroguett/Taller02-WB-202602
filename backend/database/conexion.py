from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import configuracion

engine = create_engine(configuracion.url_base_datos, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

# Nombres fijos para las restricciones, así Alembic genera migraciones con nombres predecibles.
CONVENCION_NOMBRES = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=CONVENCION_NOMBRES)


def obtener_db() -> Iterator[Session]:
    """Abre una sesión por solicitud y la cierra al terminar, aunque haya un error."""
    with SessionLocal() as sesion:
        yield sesion


Sesion = Annotated[Session, Depends(obtener_db)]
