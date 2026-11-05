from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Guardado(Base):
    """Tabla de unión usuario → pieza: «usuario_id guardó pieza_id en sus favoritos»."""

    __tablename__ = "guardados"

    # Las dos claves foráneas forman juntas la clave primaria: una pieza se guarda una sola vez.
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True
    )
    # Índice propio: el contador de cada pieza busca por esta columna.
    pieza_id: Mapped[int] = mapped_column(
        ForeignKey("piezas.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    # Ordena la página Favoritos: lo guardado más recientemente aparece primero.
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
